import { useSyncExternalStore } from "react";

// "low" trades render resolution and post-processing for frame rate on weak GPUs.
// Decided once from the GPU name (or ?quality=high|low), then a frame-time
// watchdog may demote high -> low once. It never promotes back.
export type GpuTier = "high" | "low";

const LOW_GPU =
  /intel.*(uhd|hd graphics|iris)|swiftshader|llvmpipe|softpipe|basic render|microsoft basic|mali|adreno \(tm\) [1-5]\d\d|powervr/i;

function rendererName(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) return "";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return name;
  } catch {
    return "";
  }
}

const param = new URLSearchParams(window.location.search).get("quality");
const forced = param === "high" || param === "low" ? param : null;

function detect(): GpuTier {
  if (forced) return forced;
  const name = rendererName();
  if (name) return LOW_GPU.test(name) ? "low" : "high";
  // GPU unknown: fall back to the device's size hints
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return navigator.hardwareConcurrency <= 4 || (memory !== undefined && memory <= 4)
    ? "low"
    : "high";
}

let tier: GpuTier = detect();
const listeners = new Set<() => void>();

export const getGpuTier = () => tier;

export function onGpuTierChange(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export const useGpuTier = () => useSyncExternalStore(onGpuTierChange, getGpuTier);

// Watchdog: while a 3D scene is drawing, if the median frame over a ~2s
// window is slower than 25ms (< 40fps), drop to low for the rest of the visit
const WINDOW_MS = 2000;
const SLOW_FRAME_MS = 25;
// A gap this long is a hidden/occluded tab or a one-off stall, not a slow GPU
const MAX_GAP_MS = 250;

const busy = new Set<string>();
let frames: number[] = [];
let windowStart = 0;
let last = 0;
let rafId: number | undefined;

function demote() {
  tier = "low";
  stopWatch();
  listeners.forEach((listener) => listener());
}

function tick(now: number) {
  rafId = requestAnimationFrame(tick);
  const gap = now - last;
  last = now;
  if (gap > MAX_GAP_MS || document.visibilityState !== "visible") {
    frames = [];
    windowStart = now;
    return;
  }
  frames.push(gap);
  if (now - windowStart < WINDOW_MS) return;
  const sorted = frames.sort((a, b) => a - b);
  if (sorted[Math.floor(sorted.length / 2)] > SLOW_FRAME_MS) demote();
  frames = [];
  windowStart = now;
}

function stopWatch() {
  if (rafId !== undefined) cancelAnimationFrame(rafId);
  rafId = undefined;
}

// Scenes report when they are actually drawing; frames are only judged then
export function setSceneBusy(scene: string, isBusy: boolean) {
  if (isBusy) busy.add(scene);
  else busy.delete(scene);
  if (tier === "low" || forced) return;
  if (busy.size && rafId === undefined) {
    frames = [];
    last = windowStart = performance.now();
    rafId = requestAnimationFrame(tick);
  } else if (!busy.size) {
    stopWatch();
  }
}

// Exposed for the perf benchmarks
(window as Window & { __gpuTier?: () => GpuTier }).__gpuTier = getGpuTier;
