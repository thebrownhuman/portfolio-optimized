import * as THREE from "three";
import gsap from "gsap";
import { timelineScrub } from "./scrollMode";

let charCtx: gsap.Context | undefined;
let allCtx: gsap.Context | undefined;
let onCharTimelineUpdate: (() => void) | undefined;

export type StandardMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;

// The character scene renders on demand; scroll timelines tell it when they moved the camera/model
export function setCharTimelineListener(listener: (() => void) | undefined) {
  onCharTimelineUpdate = listener;
}

// Reverts and rebuilds only these timelines; other ScrollTriggers are untouched
export function setCharTimeline(
  character: THREE.Object3D<THREE.Object3DEventMap> | null,
  camera: THREE.PerspectiveCamera
) {
  // kill, not revert: keep inline styles set outside this context (e.g. the intro rim glow)
  if (charCtx) {
    charCtx.kill();
    // kill() leaves everything where the old timelines put it, and the rebuilt
    // .to() tweens would record those values as their start. Go back to the
    // fresh-load pose first so a rebuild matches a fresh load at any scroll position
    resetCharPose(character, camera);
  }
  charCtx = gsap.context(() => buildCharTimeline(character, camera));
}

type Pose = { x: number; y: number; z: number };
const basePose = new WeakMap<THREE.Object3D, Pose>();
const savePose = (obj: THREE.Object3D, v: THREE.Vector3 | THREE.Euler) => {
  if (!basePose.has(obj)) basePose.set(obj, { x: v.x, y: v.y, z: v.z });
};

// The values each scroll-driven property has on a fresh load, recorded before any timeline runs
function saveCharPose(character: THREE.Object3D | null, camera: THREE.PerspectiveCamera) {
  savePose(camera, camera.position);
  if (!character) return;
  savePose(character, character.rotation);
  const neck = character.getObjectByName("spine005");
  if (neck) savePose(neck, neck.rotation);
}

// Inline props the character timelines tween, per element. Only these are
// cleared: other code writes inline styles on some of these elements too
const SCROLL_PROPS: Array<[string, string]> = [
  [".character-model", "transform,opacity,pointerEvents"],
  [".landing-container", "transform,opacity"],
  [".about-me", "transform"],
  [".about-section", "transform,opacity"],
  [".what-box-in", "display"],
  [".whatIDO", "transform"],
];

function resetCharPose(character: THREE.Object3D | null, camera: THREE.PerspectiveCamera) {
  const cam = basePose.get(camera);
  if (cam) camera.position.set(cam.x, cam.y, cam.z);
  if (character) {
    const rot = basePose.get(character);
    if (rot) character.rotation.set(rot.x, rot.y, rot.z);
    const neck = character.getObjectByName("spine005");
    const neckRot = neck && basePose.get(neck);
    if (neck && neckRot) neck.rotation.set(neckRot.x, neckRot.y, neckRot.z);
  }
  SCROLL_PROPS.forEach(([selector, props]) => gsap.set(selector, { clearProps: props }));
}

export function killCharTimeline() {
  charCtx?.revert();
  charCtx = undefined;
  allCtx?.revert();
  allCtx = undefined;
}

function buildCharTimeline(
  character: THREE.Object3D<THREE.Object3DEventMap> | null,
  camera: THREE.PerspectiveCamera
) {
  saveCharPose(character, camera);
  let flickerTl: gsap.core.Timeline | undefined;
  // Flicker only while the monitor is on screen: after tl2 starts, before tl3 scrolls it away
  const syncFlicker = () => {
    if (!flickerTl) return;
    const on = tl2.progress() > 0 && tl3.progress() < 1;
    if (on === flickerTl.paused()) flickerTl.paused(!on);
  };
  const tl1 = gsap.timeline({
    scrollTrigger: {
      trigger: ".landing-section",
      start: "top top",
      end: "bottom top",
      scrub: timelineScrub,
      invalidateOnRefresh: true,
      onUpdate: () => onCharTimelineUpdate?.(),
    },
  });
  const tl2 = gsap.timeline({
    scrollTrigger: {
      trigger: ".about-section",
      start: "center 55%",
      end: "bottom top",
      scrub: timelineScrub,
      invalidateOnRefresh: true,
      onUpdate: () => {
        syncFlicker();
        onCharTimelineUpdate?.();
      },
    },
  });
  const tl3 = gsap.timeline({
    scrollTrigger: {
      trigger: ".whatIDO",
      start: "top top",
      end: "bottom top",
      scrub: timelineScrub,
      invalidateOnRefresh: true,
      onUpdate: () => {
        syncFlicker();
        onCharTimelineUpdate?.();
      },
    },
  });
  let screenLight: StandardMesh | undefined, monitor: StandardMesh | undefined;
  character?.children.forEach((obj) => {
    if (obj.name === "Plane004") {
      obj.children.forEach((c) => {
        const child = c as StandardMesh;
        child.material.transparent = true;
        child.material.opacity = 0;
        if (child.material.name === "Material.018") {
          monitor = child;
          child.material.color.set("#FFFFFF");
        }
      });
    }
    if (obj.name === "screenlight") {
      const object = obj as StandardMesh;
      object.material.transparent = true;
      object.material.opacity = 0;
      object.material.emissive.set("#B0F5EA");
      flickerTl = gsap.timeline({ repeat: -1, repeatRefresh: true, paused: true }).to(object.material, {
        emissiveIntensity: () => Math.random() * 8,
        duration: () => Math.random() * 0.6,
        delay: () => Math.random() * 0.1,
      });
      screenLight = object;
    }
  });
  const neckBone = character?.getObjectByName("spine005");
  if (window.innerWidth > 1024) {
    if (character) {
      tl1
        .fromTo(character.rotation, { y: 0 }, { y: 0.7, duration: 1 }, 0)
        .to(camera.position, { z: 22 }, 0)
        .fromTo(".character-model", { x: 0 }, { x: "-25%", duration: 1 }, 0)
        .to(".landing-container", { opacity: 0, duration: 0.4 }, 0)
        .to(".landing-container", { y: "40%", duration: 0.8 }, 0)
        .fromTo(".about-me", { y: "-50%" }, { y: "0%" }, 0);

      tl2
        .to(
          camera.position,
          { z: 75, y: 8.4, duration: 6, delay: 2, ease: "power3.inOut" },
          0
        )
        .to(".about-section", { y: "30%", duration: 6 }, 0)
        .to(".about-section", { opacity: 0, delay: 3, duration: 2 }, 0)
        .fromTo(
          ".character-model",
          { pointerEvents: "inherit" },
          { pointerEvents: "none", x: "-12%", delay: 2, duration: 5 },
          0
        )
        .to(character.rotation, { y: 0.92, x: 0.12, delay: 3, duration: 3 }, 0)
        .fromTo(
          ".what-box-in",
          { display: "none" },
          { display: "flex", duration: 0.1, delay: 6 },
          0
        )
        .fromTo(
          ".character-rim",
          { opacity: 1, scaleX: 1.4 },
          { opacity: 0, scale: 0, y: "-70%", duration: 5, delay: 2 },
          0.3
        );

      // Skip (don't throw) if a re-exported model renames these nodes
      if (neckBone) tl2.to(neckBone.rotation, { x: 0.6, delay: 2, duration: 3 }, 0);
      else console.warn('GsapScroll: "spine005" not found, skipping neck tween');
      if (monitor) {
        tl2
          .to(monitor.material, { opacity: 1, duration: 0.8, delay: 3.2 }, 0)
          .fromTo(monitor.position, { y: -10, z: 2 }, { y: 0, z: 0, delay: 1.5, duration: 3 }, 0);
      } else console.warn('GsapScroll: monitor mesh not found, skipping monitor tweens');
      if (screenLight) tl2.to(screenLight.material, { opacity: 1, duration: 0.8, delay: 4.5 }, 0);
      else console.warn('GsapScroll: "screenlight" not found, skipping screen light tween');

      tl3
        .fromTo(
          ".character-model",
          { y: "0%" },
          { y: "-100%", duration: 4, ease: "none", delay: 1 },
          0
        )
        // The slide only clears the viewport once Career is already on screen, so the
        // model fades out first, over t 2.4-3.6 of 5 (native scroll). Measured at
        // 2464x1256, 1920x1080, 1440x900, 1600x700: at the end the What I Do cards are
        // 12-28% from the top of the screen and the feet are still above the Career
        // heading. Later (3.1) leaves the half-faded legs hanging over Career on tall
        // screens; earlier (1.8) faded him with the cards still mid-screen
        .fromTo(
          ".character-model",
          { opacity: 1 },
          { opacity: 0, duration: 1.2, ease: "none", delay: 2.4 },
          0
        )
        .fromTo(".whatIDO", { y: 0 }, { y: "15%", duration: 2 }, 0)
        .to(character.rotation, { x: -0.04, duration: 2, delay: 1 }, 0);
    }
  }
  syncFlicker();
}

export function setAllTimeline() {
  allCtx?.kill();
  allCtx = gsap.context(buildAllTimeline);
}

function buildAllTimeline() {
  const careerTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".career-section",
      // Start as the heading scrolls in, so entries reveal with it instead of popping in mid-screen
      start: "top 50%",
      end: "100% center",
      scrub: timelineScrub,
      invalidateOnRefresh: true,
    },
  });
  // Grow the line with scaleY (not max-height) so the dot riding its tip doesn't
  // shift layout; the dot is counter-scaled to keep its shape and glow
  const grow = { scale: 0.1 };
  const applyGrow = () => {
    gsap.set(".career-timeline", { scaleY: grow.scale });
    gsap.set(".career-dot", { scaleY: 1 / grow.scale });
  };
  applyGrow();
  careerTimeline
    .fromTo(grow, { scale: 0.1 }, { scale: 1, duration: 0.5, onUpdate: applyGrow }, 0)

    .fromTo(
      ".career-timeline",
      { opacity: 0 },
      { opacity: 1, duration: 0.1 },
      0
    )
    .fromTo(
      ".career-dot",
      { animationIterationCount: "infinite" },
      {
        animationIterationCount: "1",
        delay: 0.3,
        duration: 0.1,
      },
      0
    );

  // One tween per entry instead of a stagger: a staggered fromTo only rendered
  // the first box's "from", so entries 2+ showed at full opacity before their turn
  gsap.utils.toArray<HTMLElement>(".career-info-box").forEach((box, i) => {
    careerTimeline.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.5 }, i * 0.1);
  });

  if (window.innerWidth > 1024) {
    careerTimeline.fromTo(
      ".career-section",
      { y: 0 },
      { y: "20%", duration: 0.5, delay: 0.2 },
      0
    );
  } else {
    careerTimeline.fromTo(
      ".career-section",
      { y: 0 },
      { y: 0, duration: 0.5, delay: 0.2 },
      0
    );
  }
}
