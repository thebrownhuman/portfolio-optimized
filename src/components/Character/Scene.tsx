import { useEffect, useRef } from "react";
import * as THREE from "three";
import setCharacter from "./utils/character";
import setLighting from "./utils/lighting";
import { useLoading } from "../../context/LoadingProvider";
import handleResize from "./utils/resizeUtils";
import {
  handleMouseMove,
  handleTouchEnd,
  handleHeadRotation,
  handleTouchMove,
} from "./utils/mouseUtils";
import setAnimations from "./utils/animationUtils";
import { setProgress } from "../Loading";
import { killCharTimeline } from "../utils/GsapScroll";
import onDebouncedResize from "../utils/debouncedResize";

const Scene = () => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const hoverDivRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef(new THREE.Scene());
  const { setLoading } = useLoading();

  useEffect(() => {
    const currentDiv = canvasDiv.current;
    if (!currentDiv) return;

    let rect = currentDiv.getBoundingClientRect();
    let container = { width: rect.width, height: rect.height };
    const aspect = container.width / container.height;
    const scene = sceneRef.current;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(container.width, container.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    currentDiv.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(14.5, aspect, 0.1, 1000);
    camera.position.z = 10;
    camera.position.set(0, 13.1, 24.7);
    camera.zoom = 1.1;
    camera.updateProjectionMatrix();

    let headBone: THREE.Object3D | null = null;
    let screenLight: any | null = null;
    let mixer: THREE.AnimationMixer;
    let animFrameId: number;
    let disposed = false;

    const clock = new THREE.Clock();

    // Preload project images — returns a promise that resolves when all are cached
    const preloadImages = () => {
      const urls = [
        "/images/Solidx.webp",
        "/images/radix.webp",
        "/images/bond.webp",
        "/images/sapphire.webp",
        "/images/Maxlife.webp",
      ];
      return Promise.all(
        urls.map(
          (src) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => resolve(); // don't block on error
              img.src = src;
            })
        )
      );
    };
    const imagesReady = preloadImages();

    const light = setLighting(scene);
    let progress = setProgress((value) => setLoading(value));
    const { loadCharacter } = setCharacter(renderer, scene, camera);
    let removeResize: (() => void) | undefined;

    loadCharacter().then(async (gltf) => {
      if (disposed || !gltf) return;
      const animations = setAnimations(gltf);
      hoverDivRef.current && animations.hover(gltf, hoverDivRef.current);
      mixer = animations.mixer;
      const character = gltf.scene;
      scene.add(character);
      headBone = character.getObjectByName("spine006") || null;
      screenLight = character.getObjectByName("screenlight") || null;
      await imagesReady;
      progress.loaded().then(() => {
        if (disposed) return;
        setTimeout(() => {
          if (disposed) return;
          light.turnOnLights();
          animations.startIntro();
        }, 2500);
      });
      removeResize = onDebouncedResize(() =>
        handleResize(renderer, camera, canvasDiv, character)
      );
    });

    let mouse = { x: 0, y: 0 },
      interpolation = { x: 0.1, y: 0.2 };
    let scrollY = window.scrollY;
    const onScroll = () => (scrollY = window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });

    const onMouseMove = (event: MouseEvent) => {
      handleMouseMove(event, (x, y) => (mouse = { x, y }));
    };
    // Single touchmove handler — added once to landingDiv, not stacked per touch
    const onTouchMove = (e: TouchEvent) => {
      handleTouchMove(e, (x, y) => (mouse = { x, y }));
    };

    const onTouchEnd = () => {
      handleTouchEnd((x, y, interpolationX, interpolationY) => {
        mouse = { x, y };
        interpolation = { x: interpolationX, y: interpolationY };
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

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;
      if (headBone) {
        handleHeadRotation(
          headBone,
          mouse.x,
          mouse.y,
          interpolation.x,
          interpolation.y,
          THREE.MathUtils.lerp,
          scrollY
        );
        light.setPointLight(screenLight);
      }
      const delta = clock.getDelta();
      if (mixer) {
        mixer.update(delta);
      }
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      disposed = true;
      cancelAnimationFrame(animFrameId);
      visibilityObserver.disconnect();
      removeResize?.();
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
      <div className="character-container">
        <div className="character-model" ref={canvasDiv}>
          <div className="character-rim"></div>
          <div className="character-hover" ref={hoverDivRef}></div>
        </div>
      </div>
    </>
  );
};

export default Scene;
