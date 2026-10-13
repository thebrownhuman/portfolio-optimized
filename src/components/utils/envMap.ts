import * as THREE from "three";
import { RGBELoader } from "three-stdlib";
// Content-hashed by Vite (/assets/char_enviorment-<hash>.hdr): cached for a year as immutable
import envMapUrl from "../../assets/models/char_enviorment.hdr?url";

let envMap: Promise<THREE.DataTexture | null> | undefined;

// The character scene and TechStack share one download + RGBE parse (~80ms of
// main thread, ~330ms at 4x CPU). Each renderer still uploads it to its own context.
// Resolves null if the HDR fails to load: a rejection would crash TechStack's
// suspense tree and take the whole page down with it
type Decoded = { width: number; height: number; data: Uint16Array; type: THREE.TextureDataType };

// The HDR decoded in a worker (envMap.worker.ts), built into the texture
// RGBELoader.load would make; rejects if the worker can't do it
function decodeInWorker(): Promise<THREE.DataTexture> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./envMap.worker.ts", import.meta.url), { type: "module" });
    const done = () => worker.terminate();
    worker.onerror = (e) => {
      done();
      reject(e);
    };
    worker.onmessage = (e: MessageEvent<Decoded | { error: string }>) => {
      done();
      if ("error" in e.data) return reject(new Error(e.data.error));
      const { width, height, data, type } = e.data;
      // DataTextureLoader's defaults plus RGBELoader's half-float settings
      const texture = new THREE.DataTexture(data as Uint16Array<ArrayBuffer>, width, height);
      texture.type = type;
      texture.colorSpace = THREE.LinearSRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = 1;
      texture.generateMipmaps = false;
      texture.flipY = true;
      texture.needsUpdate = true;
      resolve(texture);
    };
    worker.postMessage(new URL(envMapUrl, location.href).href);
  });
}

// offMainThread: decode in a worker (first load: the loader hides the extra
// latency of starting it). The first call decides; later ones share its result
export function loadEnvMap(offMainThread = false) {
  const onPage = () => new RGBELoader().loadAsync(envMapUrl);
  envMap ??= (offMainThread ? decodeInWorker().catch(onPage) : onPage())
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
