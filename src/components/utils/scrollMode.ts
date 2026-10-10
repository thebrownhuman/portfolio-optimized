import { prefersReducedMotion } from "./reducedMotion";

// Dev/test switch for comparing scroll feel: ?scroll=original|current|light|native|normalize|hybrid.
// Without the param the site uses "original": the first site's ScrollSmoother feel,
// where one wheel notch travels about one section.
const MODES = ["original", "current", "light", "native", "normalize", "hybrid"] as const;
export type ScrollMode = (typeof MODES)[number];

const param = new URLSearchParams(window.location.search).get("scroll");

export const scrollMode: ScrollMode = (MODES as readonly string[]).includes(param ?? "")
  ? (param as ScrollMode)
  : "original";

// Only show the debug badge when the param was given, so production is unaffected
export const showScrollBadge = param !== null;

// Touch screens scroll natively by default; ?scroll= still forces a mode for testing
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
const defaultMode = param === null;

// Reduced motion always gets native scroll, whatever ?scroll= says
export const usesSmoother =
  !prefersReducedMotion &&
  !(defaultMode && coarsePointer) &&
  scrollMode !== "native" &&
  scrollMode !== "hybrid";

const SMOOTH: Partial<Record<ScrollMode, number>> = { original: 1.7, light: 0.4 };
// "original" matches the first site exactly, including effects: true
export const smootherSettings = {
  smooth: SMOOTH[scrollMode] ?? 0.9,
  speed: 1.7,
  effects: scrollMode === "original",
};

// hybrid: native scroll, but the scroll-driven timelines ease toward the scroll position
export const timelineScrub: true | number = scrollMode === "hybrid" ? 0.5 : true;
