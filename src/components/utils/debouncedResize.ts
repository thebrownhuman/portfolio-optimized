import { span } from "./perfSpan";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Callback = () => void;

const callbacks = new Set<Callback>();
let timer: number | undefined;

const onResize = () => {
  clearTimeout(timer);
  timer = window.setTimeout(() => {
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
