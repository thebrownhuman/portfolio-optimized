import * as THREE from "three";
import { GLTF, GLTFLoader, MeshoptDecoder } from "three-stdlib";

const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  // character.glb is meshopt-compressed (gltf-transform: quantize + EXT_meshopt_compression)
  loader.setMeshoptDecoder(MeshoptDecoder());

  const loadCharacter = () => {
    return new Promise<GLTF | null>((resolve, reject) => {
      try {
        let character: THREE.Object3D;
        loader.load(
          "/models/character.glb",
          async (gltf) => {
            // Anything throwing in here used to leave the promise pending (the
            // callback's own rejection went nowhere) and the loader waiting
            try {
              character = gltf.scene;
              // Swap materials before compiling so the compiled programs are the ones rendered
              character.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                  const mesh = child as THREE.Mesh;

                  // Change clothing colors to match site theme
                  if (mesh.material) {
                    if (mesh.name === "BODY.SHIRT") { // The shirt mesh
                      const newMat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
                      newMat.color = new THREE.Color("#8B4513");
                      mesh.material = newMat;
                    } else if (mesh.name === "Pant") {
                      const newMat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
                      newMat.color = new THREE.Color("#000000");
                      mesh.material = newMat;
                    }
                  }

                  mesh.frustumCulled = true;
                }
              });
              await compileOrGiveUp(renderer, character, camera, scene);
              for (const name of ["footR", "footL"]) {
                const foot = character.getObjectByName(name);
                if (foot) foot.position.y = 3.36;
                else console.warn(`Character: "${name}" not found, skipping foot offset`);
              }

              resolve(gltf);
            } catch (error) {
              console.error("Error preparing GLTF model:", error);
              reject(error);
            }
          },
          undefined,
          (error) => {
            console.error("Error loading GLTF model:", error);
            reject(error);
          }
        );
      } catch (err) {
        reject(err);
        console.error(err);
      }
    });
  };

  return { loadCharacter };
};

export default setCharacter;

// compileAsync polls KHR_parallel_shader_compile until every program reports ready
// and never settles if one doesn't: a status query that stays false or returns null
// (lost context after a GPU reset or switch), or a poll that throws. The loader then
// waited for its 30s deadline. Stop waiting; the first render compiles what's left.
const COMPILE_TIMEOUT_MS = 4000;

function compileOrGiveUp(
  renderer: THREE.WebGLRenderer,
  object: THREE.Object3D,
  camera: THREE.Camera,
  scene: THREE.Scene
) {
  const canvas = renderer.domElement;
  return new Promise<void>((resolve) => {
    const done = () => {
      clearTimeout(timer);
      canvas.removeEventListener("webglcontextlost", onLost);
      resolve();
    };
    const onLost = () => {
      console.warn("WebGL context lost while compiling shaders; continuing");
      done();
    };
    const timer = setTimeout(() => {
      console.warn(`Shader compile not done after ${COMPILE_TIMEOUT_MS / 1000}s; compiling on first render`);
      done();
    }, COMPILE_TIMEOUT_MS);
    canvas.addEventListener("webglcontextlost", onLost);
    // compileAsync compiles synchronously before it polls, and that part throws
    // on a lost context
    Promise.resolve()
      .then(() => renderer.compileAsync(object, camera, scene))
      .then(done, done);
  });
}
