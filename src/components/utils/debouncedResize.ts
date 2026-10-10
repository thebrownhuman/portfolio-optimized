import { span } from "./perfSpan";
import { debugFlag, getRevealAt, probe } from "./debugProbe";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { coarsePointer } from "./pointer";

type Callback = () => void;

const callbacks = new Set<Callback>();
let timer: number | undefined;

const ignoreEarly = debugFlag("noresize");

// On touch devices the browser toolbar collapsing/expanding while scrolling fires
// a height-only resize ~60 times a second (iOS). The layout is sized to the large
// viewport (100vh), so nothing needs rebuilding then: only a width change
// (rotation, split view) does
let lastWidth = window.innerWidth;

const onResize = () => {
  if (coarsePointer && window.innerWidth === lastWidth) return;
  lastWidth = window.innerWidth;
  probe("debounced-resize queued");
  // ?debug&noresize: ignore resizes until 3s after the reveal
  const reveal = getRevealAt();
  if (ignoreEarly && (reveal === undefined || performance.now() - reveal < 3000)) return;
  clearTimeout(timer);
  timer = window.setTimeout(() => {
    probe("debounced-resize run");
    callbacks.forEach((cb) => cb());
    // Recalculate trigger positions once, after every subscriber rebuilt its animations
    span("ScrollTrigger.refresh", () => ScrollTrigger.refresh());
  }, 200);
};

// Single debounced window resize path shared by every component
export default function onDebouncedResize(cb: Callback) {
  if (callbacks.size === 0) window.addEventListener("resize", onResize);
  callbacks.add(cb);
  return () => {
    callbacks.delete(cb);
    if (callbacks.size === 0) {
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    }
  };
}
