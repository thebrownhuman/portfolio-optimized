import { ScrollTrigger } from "gsap/ScrollTrigger";

// ?debug only: a timeline of browser events around the reveal, and switches that
// turn single suspects off, for finding an intro stall on a real phone
const params = new URLSearchParams(window.location.search);
const on = params.has("debug");

// e.g. ?debug&noglow — each one removes a single suspect
export const debugFlag = (
  name: "noloaderexit" | "norelease" | "noglow" | "norim" | "nocursor" | "noresize"
) => on && params.has(name);

// ?debug&dpr=1.5: cap the character canvas's pixel ratio
const dprCap = Number(params.get("dpr"));
export const debugDprCap = on && dprCap > 0 ? dprCap : undefined;

const events: Array<[number, string]> = [];
let revealAt: number | undefined;

export function probe(name: string) {
  if (!on) return;
  const now = performance.now();
  if (name === "reveal") revealAt = now;
  if (events.length < 300) events.push([now, name]);
  // Resize events are kept past the cap (oldest dropped) for the live badge line
  else if (RESIZE_EVENT.test(name)) {
    const i = events.findIndex(([, n]) => RESIZE_EVENT.test(n));
    if (i >= 0) events.splice(i, 1);
    events.push([now, name]);
  }
}

export const getRevealAt = () => revealAt;

// The last few resize-related events at any time (relative to the reveal), for
// checking window resizes on a device after the intro window has passed
const RESIZE_EVENT = /resize|setSize|canvas fit/;
export function recentResizeEvents(count = 6) {
  const start = revealAt ?? 0;
  return events
    .filter(([, name]) => RESIZE_EVENT.test(name))
    .slice(-count)
    .map(([t, name]) => `+${Math.round(t - start)} ${name}`)
    .join(", ");
}

// Events from 100ms before the reveal to `windowMs` after, as "+590 name"
export function probeTimeline(windowMs: number) {
  if (revealAt === undefined) return "no reveal";
  const start = revealAt;
  return events
    .filter(([t]) => t >= start - 100 && t <= start + windowMs)
    .map(([t, name]) => `${t - start >= 0 ? "+" : ""}${Math.round(t - start)} ${name}`)
    .join(", ");
}

if (on) {
  if (params.has("noglow")) document.documentElement.classList.add("dbg-noglow");
  if (params.has("norim")) document.documentElement.classList.add("dbg-norim");

  window.addEventListener("resize", () =>
    probe(`resize ${window.innerWidth}x${window.innerHeight}`)
  );
  window.visualViewport?.addEventListener("resize", () =>
    probe(`vv-resize ${Math.round(window.visualViewport?.height ?? 0)}`)
  );
  window.addEventListener("scroll", () => probe("scroll"), { passive: true, once: true });
  // Image loads (capture: load doesn't bubble)
  document.addEventListener(
    "load",
    (e) => {
      const el = e.target as HTMLElement;
      if (el instanceof HTMLImageElement) {
        probe(`img ${(el.currentSrc || el.src).split("/").pop()}`);
      }
    },
    true
  );
  document.fonts?.addEventListener("loadingdone", () => probe("fonts done"));
  ScrollTrigger.addEventListener("refreshInit", () => probe("ST refreshInit"));
  ScrollTrigger.addEventListener("refresh", () => probe("ST refresh"));
  // Class changes on the page roots, and removed elements with a class
  new MutationObserver((records) => {
    records.forEach((r) => {
      if (r.type === "attributes") {
        const el = r.target as HTMLElement;
        const root = ["HTML", "BODY", "MAIN"].includes(el.tagName);
        if (!root && !String(el.className).includes("loading")) return;
        probe(`class ${el.tagName.toLowerCase()}=${el.className}`.slice(0, 60));
      } else {
        r.removedNodes.forEach((n) => {
          if (n instanceof HTMLElement && n.className) probe(`removed .${n.className}`.slice(0, 50));
        });
      }
    });
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"], attributeOldValue: false });
  // Long frames for 12s, with the gap's end time
  let last = 0;
  const startedAt = performance.now();
  const tick = (now: number) => {
    if (last && now - last > 50) probe(`FRAME ${Math.round(now - last)}ms`);
    last = now;
    if (now - startedAt < 12000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
