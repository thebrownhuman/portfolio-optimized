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
    let worst = { at: 0, dt: 0 };
    let first = 0;
    let last = 0;
    let raf = 0;
    const tick = (now: number) => {
      if (!first) first = now;
      else {
        frames.push(now - last);
        if (now - last > worst.dt) worst = { at: now, dt: now - last };
      }
      last = now;
      if (now - first < INTRO_MS) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const stats = (list: number[]) => {
        const sorted = [...list].sort((a, b) => a - b);
        const at = (q: number) => (sorted[Math.floor((sorted.length - 1) * q)] ?? 0).toFixed(1);
        return `p50 ${at(0.5)} p95 ${at(0.95)} max ${at(1)}ms`;
      };
      // Canvas renders in the same window, and how far the intro clip moved per render
      const renders = (
        (window as Window & { __charRenders?: Array<[number, number]> }).__charRenders ?? []
      ).filter(([t]) => t >= first && t <= now);
      const gaps: number[] = [];
      let worstStep = 0;
      for (let i = 1; i < renders.length; i++) {
        const dt = renders[i][0] - renders[i - 1][0];
        gaps.push(dt);
        // clip seconds advanced vs wall seconds elapsed (1 = in step)
        if (renders[i][1] >= 0 && renders[i - 1][1] >= 0 && dt > 0) {
          worstStep = Math.max(worstStep, Math.abs(renders[i][1] - renders[i - 1][1]) * 1000);
        }
      }
      const clip = renders.length ? renders[renders.length - 1][1].toFixed(2) : "-";
      // The reveal fires just before the first frame we see, so look back a little
      const spans = performance
        .getEntriesByType("measure")
        .filter((m) => m.startTime + m.duration >= first - 300 && m.startTime <= now)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 4)
        .map((m) => `${m.name} ${m.duration.toFixed(0)}`)
        .join(", ");
      setSummary(
        `intro 3s: page ${frames.length} frames ${stats(frames)}, >20ms ${frames.filter((f) => f > 20).length}` +
          ` | canvas ${renders.length} renders ${stats(gaps)}, >20ms ${gaps.filter((g) => g > 20).length}` +
          ` | clip t ${clip}s, max step ${worstStep.toFixed(0)}ms` +
          ` | worst frame ${worst.dt.toFixed(0)}ms @${(worst.at - first).toFixed(0)}ms` +
          ` | spans: ${spans || "none"}`
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
