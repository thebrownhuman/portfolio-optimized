import * as THREE from "three";
import { RGBELoader } from "three-stdlib";

let envMap: Promise<THREE.DataTexture> | undefined;

// The character scene and TechStack share one download + RGBE parse (~80ms of
// main thread, ~330ms at 4x CPU). Each renderer still uploads it to its own context
export function loadEnvMap() {
  envMap ??= new RGBELoader()
    .loadAsync("/models/char_enviorment.hdr?v=2")
    .then((texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      return texture;
    });
  return envMap;
}
