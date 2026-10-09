import * as THREE from "three";
import { GLTF, GLTFLoader, MeshoptDecoder } from "three-stdlib";
import { setCharTimeline, setAllTimeline } from "../../utils/GsapScroll";

const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  // character.glb is meshopt-compressed (gltf-transform: quantize + EXT_meshopt_compression)
  loader.setMeshoptDecoder(MeshoptDecoder());

  const loadCharacter = () => {
    return new Promise<GLTF | null>(async (resolve, reject) => {
      try {
        let character: THREE.Object3D;
        loader.load(
          "/models/character.glb",
          async (gltf) => {
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
            await renderer.compileAsync(character, camera, scene);
            setCharTimeline(character, camera);
            setAllTimeline();
            for (const name of ["footR", "footL"]) {
              const foot = character.getObjectByName(name);
              if (foot) foot.position.y = 3.36;
              else console.warn(`Character: "${name}" not found, skipping foot offset`);
            }

            resolve(gltf);
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
