import * as THREE from "three";
import { RGBELoader } from "three-stdlib";
// Content-hashed by Vite (/assets/char_enviorment-<hash>.hdr): cached for a year as immutable
import envMapUrl from "../../assets/models/char_enviorment.hdr?url";

let envMap: Promise<THREE.DataTexture | null> | undefined;

// The character scene and TechStack share one download + RGBE parse (~80ms of
// main thread, ~330ms at 4x CPU). Each renderer still uploads it to its own context.
// Resolves null if the HDR fails to load: a rejection would crash TechStack's
// suspense tree and take the whole page down with it
export function loadEnvMap() {
  envMap ??= new RGBELoader()
    .loadAsync(envMapUrl)
    .then((texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      return texture;
    })
    .catch((error) => {
      console.warn("Environment map failed to load; rendering without it", error);
      return null;
    });
  return envMap;
}
