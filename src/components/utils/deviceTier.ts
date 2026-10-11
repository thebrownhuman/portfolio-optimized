import { prefersReducedMotion } from "./reducedMotion";
import { DEBUG, debugParams } from "./debug";

// Which devices get the live 3D character, and which keep the still poster
// (public/images/character-poster-*). Capability only: the same page and
// content for everyone, no user-agent checks.
//
// The poster tier is any of:
// - a software WebGL renderer (SwiftShader, llvmpipe, softpipe, Microsoft
//   Basic Render): the scene would draw on the CPU, at a few frames a second
// - deviceMemory <= 2 (GB) or hardwareConcurrency <= 2 (cores)
// - Data Saver on (the model and HDR are ~650KB)
// - prefers-reduced-motion
export const LOW_MEMORY_GB = 2;
export const LOW_CORES = 2;
const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|basic render/i;

function softwareRenderer(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    // No WebGL at all: nothing to draw the scene with
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return SOFTWARE_GL.test(name);
  } catch {
    return true;
  }
}

// Test override (?tier=poster|3d), debug builds only
const forced = DEBUG ? debugParams.get("tier") : null;

function detect(): boolean {
  if (typeof window === "undefined") return false;
  if (forced === "poster" || forced === "3d") return forced === "3d";
  if (prefersReducedMotion) return false;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  if (nav.connection?.saveData) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= LOW_MEMORY_GB) return false;
  if (nav.hardwareConcurrency && nav.hardwareConcurrency <= LOW_CORES) return false;
  return !softwareRenderer();
}

// Decided once, at startup: it also decides whether the loader plays
export const live3D = detect();
