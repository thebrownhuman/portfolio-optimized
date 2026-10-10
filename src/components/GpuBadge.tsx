import { useEffect, useState } from "react";
import { useLoading } from "../context/LoadingProvider";
import { getGpuTierReason, gpuRenderer, useGpuTier } from "./utils/gpuTier";

const show = new URLSearchParams(window.location.search).has("debug");
const INTRO_MS = 3000;

// Frame intervals for the first 3s after the loader reveals the page
function useIntroFrames(start: boolean) {
  const [summary, setSummary] = useState("intro: waiting");
  useEffect(() => {
    if (!show || !start) return;
    const frames: number[] = [];
    let first = 0;
    let last = 0;
    let raf = 0;
    const tick = (now: number) => {
      if (!first) first = now;
      else frames.push(now - last);
      last = now;
      if (now - first < INTRO_MS) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const sorted = [...frames].sort((a, b) => a - b);
      const at = (q: number) => sorted[Math.floor((sorted.length - 1) * q)].toFixed(1);
      setSummary(
        `intro 3s: ${frames.length} frames, p50 ${at(0.5)} p95 ${at(0.95)} max ${at(1)}ms, ` +
          `>20ms ${frames.filter((f) => f > 20).length}, >50ms ${frames.filter((f) => f > 50).length}`
      );
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start]);
  return summary;
}

// ?debug: shows which quality tier this device got and why, plus intro frame
// times, for checking real phones/Macs
const GpuBadge = () => {
  const tier = useGpuTier();
  const { isLoading } = useLoading();
  const intro = useIntroFrames(!isLoading);
  if (!show) return null;
  return (
    <div className="scroll-mode-badge gpu-badge" aria-hidden="true">
      GPU: {tier} (reason: {getGpuTierReason()}) {gpuRenderer || "unknown renderer"} | dpr{" "}
      {window.devicePixelRatio} | {intro}
    </div>
  );
};

export default GpuBadge;
