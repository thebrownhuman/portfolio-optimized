// Dev/test switch for comparing scroll feel: ?scroll=current|light|native|normalize|hybrid.
// Without the param the site uses native scroll (trackpads felt laggy under ScrollSmoother).
const MODES = ["current", "light", "native", "normalize", "hybrid"] as const;
export type ScrollMode = (typeof MODES)[number];

const param = new URLSearchParams(window.location.search).get("scroll");

export const scrollMode: ScrollMode = (MODES as readonly string[]).includes(param ?? "")
  ? (param as ScrollMode)
  : "native";

// Only show the debug badge when the param was given, so production is unaffected
export const showScrollBadge = param !== null;

export const usesSmoother = scrollMode !== "native" && scrollMode !== "hybrid";

export const smootherSettings = { smooth: scrollMode === "light" ? 0.4 : 0.9, speed: 1.7 };

// hybrid: native scroll, but the scroll-driven timelines ease toward the scroll position
export const timelineScrub: true | number = scrollMode === "hybrid" ? 0.5 : true;
