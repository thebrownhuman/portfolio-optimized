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

// Why the current tier was picked; shown by the ?debug badge
export type GpuTierReason = "override" | "renderer" | "fallback" | "watchdog";
export const gpuRenderer = rendererName();

function detect(): [GpuTier, GpuTierReason] {
  if (forced) return [forced, "override"];
  if (gpuRenderer) return [LOW_GPU.test(gpuRenderer) ? "low" : "high", "renderer"];
  // GPU unknown: fall back to the device's size hints
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const small =
    navigator.hardwareConcurrency <= 4 || (memory !== undefined && memory <= 4);
  return [small ? "low" : "high", "fallback"];
}

let [tier, reason] = detect();
const listeners = new Set<() => void>();

export const getGpuTier = () => tier;
export const getGpuTierReason = () => reason;

export function onGpuTierChange(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export const useGpuTier = () => useSyncExternalStore(onGpuTierChange, getGpuTier);

// Watchdog: judges frames only while a 3D scene is drawing, against the
// device's own frame cadence, so a browser capped at 30fps (low power mode,
// battery saver, 30Hz screens) is not mistaken for a slow GPU. It demotes
// high -> low once, on dropped frames, and never promotes back.
const WINDOW_MS = 2000;
// Demote when fewer than this share of the cadence's frames are delivered
const MIN_DELIVERED = 0.6;
// ...and the median frame is slower than 45fps: a variable-refresh screen
// steadily running a heavy scene at, say, 75 of 144Hz is fine as it is
const SLOW_MEDIAN_MS = 1000 / 45;
// Under 20fps even on the fastest frames: no frame cap goes this low
const HOPELESS_FRAME_MS = 50;
// A gap this long is a hidden/occluded tab or a one-off stall, not a slow GPU
const MAX_GAP_MS = 250;

const busy = new Set<string>();
let frames: number[] = [];
let windowStart = 0;
let last = 0;
let rafId: number | undefined;
// Steady frame interval: the fastest window's 10th-percentile frame, kept
// across windows so light scenes (the idle character) set it before a heavy one
let cadence = Infinity;

function demote() {
  tier = "low";
  reason = "watchdog";
  stopWatch();
  listeners.forEach((listener) => listener());
}

function judgeWindow(elapsed: number) {
  if (frames.length < 10) return;
  const sorted = frames.sort((a, b) => a - b);
  const fast = sorted[Math.floor(sorted.length / 10)];
  cadence = Math.min(cadence, fast);
  const median = sorted[Math.floor(sorted.length / 2)];
  const delivered = frames.length / (elapsed / cadence);
  if ((delivered < MIN_DELIVERED && median > SLOW_MEDIAN_MS) || fast > HOPELESS_FRAME_MS) {
    demote();
  }
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
  judgeWindow(now - windowStart);
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
(window as Window & { __gpuTier?: () => string }).__gpuTier = () => `${tier}:${reason}`;
