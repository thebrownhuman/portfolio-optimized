import { useEffect, useRef } from "react";
import * as THREE from "three";
import setCharacter from "./utils/character";
import setLighting from "./utils/lighting";
import { useLoading } from "../../context/LoadingProvider";
import { span } from "../utils/perfSpan";
import { debugDprCap, debugOn, probe } from "../utils/debugProbe";
import { DEBUG } from "../utils/debug";
import handleResize from "./utils/resizeUtils";
import {
  WORK_IMAGES,
  WORK_IMAGE_SIZES,
  workImageSrc,
  workImageSrcSet,
} from "../utils/workImages";
import {
  handleMouseMove,
  handleTouchEnd,
  handleHeadRotation,
  handleTouchMove,
} from "./utils/mouseUtils";
import setAnimations from "./utils/animationUtils";
import { setProgress } from "../Loading";
import {
  killCharTimeline,
  setAllTimeline,
  setCharTimeline,
  setCharTimelineListener,
  type StandardMesh,
} from "../utils/GsapScroll";
import onDebouncedResize from "../utils/debouncedResize";
import { getGpuTier, onGpuTierChange, setSceneBusy } from "../utils/gpuTier";

const Scene = () => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const hoverDivRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef(new THREE.Scene());
  const { setLoading, isLoading } = useLoading();
  // The intro (rise from below) starts as the page is revealed. It used to start,
  // with the lights, on a fixed 2.5s timer after 100%, which matched the old
  // loader's exit but left a dark, unlit character on screen once it got faster
  const introRef = useRef<{ revealed: boolean; start?: () => void }>({ revealed: false });
  useEffect(() => {
    if (isLoading) return;
    introRef.current.revealed = true;
    introRef.current.start?.();
  }, [isLoading]);

  useEffect(() => {
    const currentDiv = canvasDiv.current;
    if (!currentDiv) return;

    const rect = currentDiv.getBoundingClientRect();
    const container = { width: rect.width, height: rect.height };
    const aspect = container.width / container.height;
    const scene = sceneRef.current;

    // Low tier: no MSAA and 1x resolution (antialias can't change later, so a
    // watchdog demotion only drops the pixel ratio)
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: getGpuTier() === "high",
    });
    renderer.setSize(container.width, container.height);
    const maxPixelRatio = () => debugDprCap ?? (getGpuTier() === "high" ? 2 : 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio()));
    const removeTierListener = onGpuTierChange(() => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio()));
      wake(100);
    });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    currentDiv.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(14.5, aspect, 0.1, 1000);
    camera.position.z = 10;
    camera.position.set(0, 13.1, 24.7);
    camera.zoom = 1.1;
    camera.updateProjectionMatrix();

    let headBone: THREE.Object3D | null = null;
    let screenLight: StandardMesh | null = null;
    let mixer: THREE.AnimationMixer;
    let animFrameId: number;
    let disposed = false;

    const clock = new THREE.Clock();
    // ?debug: canvas render times and the intro clip's time at each render
    const debugRenders: Array<[number, number, number]> | null = debugOn
      ? []
      : null;
    if (debugRenders) {
      (window as Window & { __charRenders?: typeof debugRenders }).__charRenders = debugRenders;
    }
    let introAction: THREE.AnimationAction | null = null;
    // The intro clip owns the head: held paused on its first frame under the
    // loader, then playing the rise. A paused clip doesn't hold the head, so the
    // head-follow turned it to face front and the clip snapped it down at the
    // reveal (front -> down -> up); while playing, the two fought for frames.
    // Follow the pointer only once the intro has finished
    let headFollow = false;
    const debugQuat = new THREE.Quaternion();
    const debugVec = new THREE.Vector3();

    // Render on demand: full rate while something changes, otherwise only the
    // looping idle clips (typing, keys, blink, screen flicker) need frames
    const IDLE_FRAME_MS = 1000 / 30;
    let activeUntil = 0;
    let lastRender = -Infinity;
    const wake = (ms: number) => {
      activeUntil = Math.max(activeUntil, performance.now() + ms);
    };
    setCharTimelineListener(() => wake(300));

    // Warm the cache for the Work carousel images (their slides sit off-screen
    // sideways, so lazy loading alone would pop them in on "next")
    const preloadImages = () => {
      // Same srcset/sizes as the slides, so the browser fetches the file they will use
      WORK_IMAGES.forEach((name) => {
        const img = new Image();
        img.decoding = "async";
        img.sizes = WORK_IMAGE_SIZES;
        img.srcset = workImageSrcSet(name);
        img.src = workImageSrc(name);
      });
    };

    const light = setLighting(scene);
    const progress = setProgress((value) => setLoading(value));
    const { loadCharacter } = setCharacter(renderer, scene, camera);
    // The canvas follows its container's real size: window resize events on iPad
    // (Stage Manager, split view) are not a reliable signal, and the container is
    // sized by CSS that changes at the 1024px breakpoint
    const fitObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      const size = renderer.getSize(new THREE.Vector2());
      if (Math.round(size.x) === Math.round(width) && Math.round(size.y) === Math.round(height)) return;
      probe(`canvas fit ${Math.round(width)}x${Math.round(height)}`);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      wake(300);
    });
    fitObserver.observe(currentDiv);
    let loadedCharacter: THREE.Object3D | null = null;
    // Registered before the model loads: a resize during the load (iPad Stage
    // Manager settling the window) must still resize the renderer and camera
    const removeResize = onDebouncedResize(() => {
      handleResize(renderer, camera, canvasDiv, loadedCharacter);
      wake(500);
    });

    loadCharacter().then(async (gltf) => {
      // Timelines are module-wide: a disposed mount (StrictMode's first one) whose
      // load finishes last must not rebind them to its own camera/character
      if (disposed || !gltf) return;
      span("setCharTimeline", () => setCharTimeline(gltf.scene, camera));
      span("setAllTimeline", setAllTimeline);
      const animations = setAnimations(gltf);
      if (hoverDivRef.current) animations.hover(gltf, hoverDivRef.current);
      mixer = animations.mixer;
      const introClip = gltf.animations.find((clip) => clip.name === "introAnimation");
      introAction = introClip ? mixer.existingAction(introClip) : null;
      if (introAction) {
        const onFinished = (e: { action: THREE.AnimationAction }) => {
          if (e.action !== introAction) return;
          headFollow = true;
          mixer.removeEventListener("finished", onFinished);
        };
        mixer.addEventListener("finished", onFinished);
      } else {
        headFollow = true;
      }
      if (debugRenders) {
        (window as Window & { __char?: unknown }).__char = { character: gltf.scene, mixer, introAction };
      }
      const character = gltf.scene;
      scene.add(character);
      loadedCharacter = character;
      headBone = character.getObjectByName("spine006") || null;
      // Exposed for the resize regression check (debug builds): the scroll-driven pose
      if (DEBUG) {
        const r = (n: number) => Math.round(n * 1000) / 1000;
        (window as Window & { __charPose?: () => number[] }).__charPose = () => [
          r(camera.position.x), r(camera.position.y), r(camera.position.z),
          r(character.rotation.x), r(character.rotation.y),
        ];
      }
      screenLight = (character.getObjectByName("screenlight") as StandardMesh | undefined) ?? null;
      progress.loaded().then(() => {
        if (disposed) return;
        // After the model, so the images don't compete with it for bandwidth
        preloadImages();
        // Light him up behind the loader (held on the intro's first frame), so the
        // page opens on a lit, already-drawn character; this also moves the first
        // render's GPU uploads off the first visible frame
        light.turnOnLights();
        // Lights tween for 2s (+0.2s delay)
        wake(2700);
        introRef.current.start = () => {
          introRef.current.start = undefined;
          if (disposed) return;
          wake(span("startIntro", animations.startIntro) + 500);
        };
        if (introRef.current.revealed) introRef.current.start();
      });
    }).catch((error) => {
      // Without this the loader waits at ~92% forever; open the site without the character
      console.error("Character failed to load", error);
      if (!disposed) progress.loaded();
    });

    let mouse = { x: 0, y: 0 },
      interpolation = { x: 0.1, y: 0.2 };
    let scrollY = window.scrollY;
    const onScroll = () => (scrollY = window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Head follow and the eyebrow hover both start from pointer movement
    const onMouseMove = (event: MouseEvent) => {
      handleMouseMove(event, (x, y) => (mouse = { x, y }));
      wake(1000);
    };
    // Single touchmove handler — added once to landingDiv, not stacked per touch
    const onTouchMove = (e: TouchEvent) => {
      handleTouchMove(e, (x, y) => (mouse = { x, y }));
      wake(1000);
    };

    const onTouchEnd = () => {
      handleTouchEnd((x, y, interpolationX, interpolationY) => {
        mouse = { x, y };
        interpolation = { x: interpolationX, y: interpolationY };
        wake(1000);
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    const landingDiv = document.getElementById("landingDiv");
    if (landingDiv) {
      landingDiv.addEventListener("touchmove", onTouchMove);
      landingDiv.addEventListener("touchend", onTouchEnd);
    }
    // Skip rendering when character is scrolled off-screen
    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      // ratio, not isIntersecting: after the scroll timeline the model sits edge-adjacent (bottom = 0)
      isVisible = entry.intersectionRatio > 0;
    });
    visibilityObserver.observe(currentDiv);

    let busy = false;
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      // The scroll timeline fades the model to opacity 0 over Career while it is
      // still in the viewport, so the observer alone keeps it drawing
      const drawing = isVisible && currentDiv.style.opacity !== "0";
      if (drawing !== busy) setSceneBusy("character", (busy = drawing));
      if (!drawing) {
        // Drop off-screen time so the mixer doesn't jump when it comes back
        clock.getDelta();
        return;
      }
      const now = performance.now();
      // Throttled frames keep the clock running, so the idle clips stay real-time
      if (now >= activeUntil && now - lastRender < IDLE_FRAME_MS - 1) return;
      lastRender = now;
      if (headBone && headFollow) {
        const prevX = headBone.rotation.x;
        const prevY = headBone.rotation.y;
        handleHeadRotation(
          headBone,
          mouse.x,
          mouse.y,
          interpolation.x,
          interpolation.y,
          THREE.MathUtils.lerp,
          scrollY
        );
        // Keep full rate until the head lerp settles
        if (
          Math.abs(headBone.rotation.x - prevX) > 1e-4 ||
          Math.abs(headBone.rotation.y - prevY) > 1e-4
        ) {
          wake(100);
        }
      }
      if (headBone && screenLight) light.setPointLight(screenLight);
      const delta = clock.getDelta();
      if (mixer) {
        mixer.update(delta);
      }
      renderer.render(scene, camera);
      if (debugRenders && debugRenders.length < 2000) {
        // Head pitch in degrees (+ up): the intro starts at about -78, the rest pose is about -6
        let pitch = NaN;
        if (headBone) {
          headBone.getWorldQuaternion(debugQuat);
          pitch = Math.round(Math.asin(debugVec.set(0, 0, 1).applyQuaternion(debugQuat).y) * 573) / 10;
        }
        debugRenders.push([now, introAction?.time ?? -1, pitch]);
      }
    };
    animate();
    return () => {
      disposed = true;
      cancelAnimationFrame(animFrameId);
      removeTierListener();
      setSceneBusy("character", false);
      visibilityObserver.disconnect();
      setCharTimelineListener(undefined);
      removeResize();
      fitObserver.disconnect();
      killCharTimeline();
      progress.dispose();
      scene.clear();
      renderer.dispose();
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      if (currentDiv.contains(renderer.domElement)) {
        currentDiv.removeChild(renderer.domElement);
      }
      if (landingDiv) {
        landingDiv.removeEventListener("touchmove", onTouchMove);
        landingDiv.removeEventListener("touchend", onTouchEnd);
      }
    };
  }, []);

  return (
    <>
      <div className="character-container" aria-hidden="true">
        <div className="character-model" ref={canvasDiv}>
          <div className="character-rim"></div>
          <div className="character-hover" ref={hoverDivRef}></div>
        </div>
      </div>
    </>
  );
};

export default Scene;
