import * as THREE from "three";
import { setCharTimeline, setAllTimeline } from "../../utils/GsapScroll";
import { probe } from "../../utils/debugProbe";

export default function handleResize(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  canvasDiv: React.RefObject<HTMLDivElement>,
  character: THREE.Object3D | null
) {
  if (!canvasDiv.current) return;
  let canvas3d = canvasDiv.current.getBoundingClientRect();
  const width = canvas3d.width;
  const height = canvas3d.height;
  probe(`renderer.setSize ${Math.round(width)}x${Math.round(height)}`);
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // Rebuild the width-dependent timelines; their contexts revert only their own triggers.
  // Before the model loads there is nothing to rebuild: the load builds them at the new size
  if (!character) return;
  setCharTimeline(character, camera);
  setAllTimeline();
}
