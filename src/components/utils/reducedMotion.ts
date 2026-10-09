// Read once at startup: the effects below are set up once, and the OS setting rarely changes mid-visit
export const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
