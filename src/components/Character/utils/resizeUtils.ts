import * as THREE from "three";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setCharTimeline, setAllTimeline } from "../../utils/GsapScroll";

let prevFlickerIntervalId: ReturnType<typeof setInterval> | undefined;
let prevFlickerTl: any;

export default function handleResize(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  canvasDiv: React.RefObject<HTMLDivElement>,
  character: THREE.Object3D
) {
  if (!canvasDiv.current) return;
  let canvas3d = canvasDiv.current.getBoundingClientRect();
  const width = canvas3d.width;
  const height = canvas3d.height;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // Clean up previous flicker resources before recreating
  if (prevFlickerIntervalId !== undefined) clearInterval(prevFlickerIntervalId);
  if (prevFlickerTl) prevFlickerTl.kill();

  const workTrigger = ScrollTrigger.getById("work");
  ScrollTrigger.getAll().forEach((trigger) => {
    if (trigger != workTrigger) {
      trigger.kill();
    }
  });
  const result = setCharTimeline(character, camera);
  prevFlickerIntervalId = result.flickerIntervalId;
  prevFlickerTl = result.flickerTl;
  setAllTimeline();
}
