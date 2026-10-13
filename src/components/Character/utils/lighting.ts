import * as THREE from "three";
import { loadEnvMap } from "../../utils/envMap";
import { gsap } from "gsap";
import { skipIntro } from "../../utils/introSkip";
import type { StandardMesh } from "../../utils/GsapScroll";

// Lets the browser run other work (input, paint) between heavy GPU setup steps
export const yieldToMain = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0));

const setLighting = (scene: THREE.Scene, renderer: THREE.WebGLRenderer) => {
  const directionalLight = new THREE.DirectionalLight(0x5eead4, 0);
  directionalLight.intensity = 0;
  directionalLight.position.set(-0.47, -0.32, -1);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0x22d3ee, 0, 100, 3);
  pointLight.position.set(3, 12, 4);
  scene.add(pointLight);

  // First load: decode the HDR in a worker and prefilter it here, in its own
  // tasks, instead of letting the renderer do it inside the first frame that
  // draws the character (with the character's shader compile, one ~350ms task).
  // Same PMREMGenerator the renderer uses, so the result is identical; the source
  // texture is left as is (TechStack shares it).
  // Returning visit (no loader): as soon as possible, the renderer prefilters it
  let envTarget: THREE.WebGLRenderTarget | null = null;
  const applyEnv = (texture: THREE.Texture) => {
    scene.environment = texture;
    scene.environmentIntensity = 0;
    scene.environmentRotation.set(5.76, 85.85, 1);
  };
  const envReady = loadEnvMap(!skipIntro)
    .then(async (texture) => {
      if (!texture) return;
      if (skipIntro) return applyEnv(texture);
      renderer.initTexture(texture);
      await yieldToMain();
      const pmrem = new THREE.PMREMGenerator(renderer);
      envTarget = pmrem.fromEquirectangular(texture);
      pmrem.dispose();
      applyEnv(envTarget.texture);
    })
    .catch((error) => {
      // Never reject: the character waits on this and must still load without it
      console.warn("Environment map prefilter failed; rendering without it", error);
    });

  function setPointLight(screenLight: StandardMesh) {
    if (screenLight.material.opacity > 0.9) {
      pointLight.intensity = screenLight.material.emissiveIntensity * 20;
    } else {
      pointLight.intensity = 0;
    }
  }
  const ease = "power2.inOut";
  // duration 0: straight to the lit state (the poster handoff)
  function turnOnLights(duration = 2) {
    gsap.to(scene, {
      environmentIntensity: 0.64,
      duration: duration,
      ease: ease,
    });
    gsap.to(directionalLight, {
      intensity: 1,
      duration: duration,
      ease: ease,
    });
    gsap.to(".character-rim", {
      y: "55%",
      opacity: 1,
      delay: duration ? 0.2 : 0,
      duration: duration,
    });
  }

  const dispose = () => envTarget?.dispose();

  return { setPointLight, turnOnLights, envReady, dispose };
};

export default setLighting;
