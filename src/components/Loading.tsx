import { span } from "./utils/perfSpan";
import { debugFlag, probe } from "./utils/debugProbe";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./styles/Loading.css";
import { useLoading } from "../context/LoadingProvider";

import Marquee from "react-fast-marquee";
import { prefersReducedMotion } from "./utils/reducedMotion";

const Loading = ({ percent, fading = false }: { percent: number; fading?: boolean }) => {
  const { setIsLoading } = useLoading();
  const [loaded, setLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [clicked, setClicked] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HTMLDivElement>(null);
  const expanderRef = useRef<HTMLDivElement>(null);
  const expanderGlowRef = useRef<HTMLDivElement>(null);

  // Exit: the black pill grows to cover the screen. Growing the wrap itself
  // (min-width/min-height) moved its box every frame (CLS ~1.6), so a fixed-size
  // layer is clipped from the pill's rect to full screen instead, on the same curve
  useLayoutEffect(() => {
    if (!clicked) return;
    const wrap = wrapRef.current;
    const hover = hoverRef.current;
    const expander = expanderRef.current;
    const glow = expanderGlowRef.current;
    if (!wrap || !hover || !expander || !glow) return;
    const { clip, glowStart, glowMove } = exitFrames(wrap, hover, expander);
    glow.style.left = `${glowStart.x}px`;
    glow.style.top = `${glowStart.y}px`;
    const anims = [
      expander.animate(clip, { duration: EXIT_MS, fill: "forwards" }),
      glow.animate(glowMove, { duration: EXIT_MS, fill: "forwards" }),
      // The hover glow faded out on its own 500ms transition
      glow.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: "ease", fill: "forwards" }),
    ];
    return () => anims.forEach((a) => a.cancel());
  }, [clicked]);

  // Fetch the intro chunk while the scene loads, not after 100%
  // loadInitialFX reports a failure; the prefetch only must not leave it unhandled
  // Once it's here, do the intro's text splitting under the loader (fonts first,
  // so the lines split as they'll render), not in the frame the character rises
  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    import("./utils/initialFX")
      .then(({ prepareInitialFX }) => {
        const prepare = () => {
          if (cancelled) return;
          if (!document.querySelector(".landing-intro h1")) {
            // The landing chunk is still loading
            if (++tries < 100) setTimeout(prepare, 150);
            return;
          }
          const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 50));
          idle(() => !cancelled && span("prepare:initialFX", prepareInitialFX));
        };
        document.fonts.ready.then(prepare);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // At 100% swap straight to "Welcome" (there used to be a dead 600ms on 100%),
  // then start the exit once its slide-in has finished
  useEffect(() => {
    if (percent < 100) return;
    setLoaded(true);
    const t = setTimeout(() => {
      setIsLoaded(true);
    }, WELCOME_MS);
    return () => clearTimeout(t);
  }, [percent]);

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // A failed chunk fetch (flaky network, or a stale tab after a deploy) used to
    // leave the loader stuck at 100%; open the page without the intro FX instead
    loadInitialFX().then((initialFX) => {
      if (cancelled) return;
      // ?debug&noloaderexit: skip the loader's exit animation and reveal at once
      const instant = debugFlag("noloaderexit");
      if (!instant) setClicked(true);
      timer = setTimeout(() => {
        probe("reveal");
        span("reveal:initialFX", () => (initialFX ? initialFX() : revealWithoutFX()));
        span("reveal:setIsLoading", () => setIsLoading(false));
      }, instant ? 0 : 900);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isLoaded, setIsLoading]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const { currentTarget: target } = e;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    target.style.setProperty("--mouse-x", `${x}px`);
    target.style.setProperty("--mouse-y", `${y}px`);
  }

  return (
    <>
      <div className={`loading-header ${fading ? "loading-fade" : ""}`}>
        <a href="/#" className="loader-title" data-cursor="disable">
          SM
        </a>
        <div className={`loaderGame ${clicked && "loader-out"}`} aria-hidden="true">
          <div className="loaderGame-container">
            <div className="loaderGame-in">
              {[...Array(27)].map((_, index) => (
                <div className="loaderGame-line" key={index}></div>
              ))}
            </div>
            <div className="loaderGame-ball"></div>
          </div>
        </div>
      </div>
      <div className={`loading-screen ${fading ? "loading-fade" : ""}`}>
        <div className="loading-marquee">
          <Marquee play={!prefersReducedMotion}>
            <span> Software Engineer</span> <span>Problem Solver</span>
            <span> Software Engineer</span> <span>Problem Solver</span>
          </Marquee>
        </div>
        <div className={`loading-expander ${clicked && "loading-expander-out"}`}>
          <div className="loading-expander-fill" ref={expanderRef}>
            <div className="loading-hover" ref={expanderGlowRef}></div>
          </div>
        </div>
        <div
          className={`loading-wrap ${clicked && "loading-clicked"}`}
          onMouseMove={(e) => handleMouseMove(e)}
          ref={wrapRef}
        >
          <div className="loading-hover" ref={hoverRef}></div>
          <div className={`loading-button ${loaded && "loading-complete"}`}>
            <div className="loading-container">
              <div className="loading-content">
                <div className="loading-content-in">
                  Loading <span>{percent}%</span>
                </div>
              </div>
              <div className="loading-box"></div>
            </div>
            <div className="loading-content2">
              <span>Welcome</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Loading;

// No retry: Chrome caches a failed dynamic import, so a second import() of the
// same chunk fails without refetching
async function loadInitialFX() {
  try {
    return (await import("./utils/initialFX")).initialFX;
  } catch (error) {
    console.warn("initialFX failed to load; opening the page without it", error);
    return undefined;
  }
}

// The parts of initialFX the page needs to be usable, without its text animations
function revealWithoutFX() {
  document.body.style.overflowY = "auto";
  document.body.style.backgroundColor = "#0a0e17";
  document.getElementsByTagName("main")[0]?.classList.add("main-active");
}

// .loading-content2 slides in on a 1s transition
const WELCOME_MS = 1000;
const EXIT_MS = 800;
const EXIT_RADIUS = { from: 100, to: 5000 };

// CSS cubic-bezier(x1, y1, x2, y2) as progress(time fraction)
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const coord = (t: number, a: number, b: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  return (x: number) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (coord(mid, x1, x2) < x) lo = mid;
      else hi = mid;
    }
    return coord((lo + hi) / 2, y1, y2);
  };
}

// Keyframes reproducing the old transition on cubic-bezier(0.33, 0.11, 1, 0.72):
// min-width/min-height from 0 to the final size (content-box, so plus padding;
// never smaller than the pill) and border-radius. The hover glow was anchored to
// the wrap's top-left, so it moves with that corner.
function exitFrames(wrap: HTMLElement, hover: HTMLElement, expander: HTMLElement) {
  const ease = cubicBezier(0.33, 0.11, 1, 0.72);
  const pill = wrap.getBoundingClientRect();
  const box = expander.getBoundingClientRect();
  const style = getComputedStyle(wrap);
  const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const cx = pill.left + pill.width / 2 - box.left;
  const cy = pill.top + pill.height / 2 - box.top;
  const glowRect = hover.getBoundingClientRect();
  const glowStart = {
    x: glowRect.left + glowRect.width / 2 - box.left,
    y: glowRect.top + glowRect.height / 2 - box.top,
  };
  const clip: Keyframe[] = [];
  const glowMove: Keyframe[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const e = ease(t);
    const w = Math.max(pill.width, (box.width - padX) * e + padX);
    const h = Math.max(pill.height, (box.height - padY) * e + padY);
    const r = EXIT_RADIUS.from + (EXIT_RADIUS.to - EXIT_RADIUS.from) * e;
    const top = cy - h / 2;
    const left = cx - w / 2;
    clip.push({
      offset: t,
      clipPath: `inset(${top}px ${box.width - left - w}px ${box.height - top - h}px ${left}px round ${r}px)`,
    });
    glowMove.push({
      offset: t,
      transform: `translate(calc(-50% + ${-(w - pill.width) / 2}px), calc(-50% + ${-(h - pill.height) / 2}px))`,
    });
  }
  return { clip, glowStart, glowMove };
}

// Safety net: if the scene never reports loaded (a hung or failed request we
// didn't catch), finish the loader anyway rather than leave the visitor stuck
const LOAD_DEADLINE_MS = 12000;

export const setProgress = (setLoading: (value: number) => void) => {
  let percent: number = 0;
  let disposed = false;
  let rafId: number | undefined;
  let loadedPromise: Promise<number> | undefined;
  const deadline = setTimeout(() => {
    console.warn(`Loading not finished after ${LOAD_DEADLINE_MS / 1000}s; showing the site anyway`);
    loaded();
  }, LOAD_DEADLINE_MS);

  let interval = setInterval(() => {
    if (disposed) { clearInterval(interval); return; }
    if (percent <= 50) {
      let rand = Math.round(Math.random() * 5);
      percent = percent + rand;
      setLoading(percent);
    } else {
      clearInterval(interval);
      interval = setInterval(() => {
        if (disposed) { clearInterval(interval); return; }
        percent = percent + Math.round(Math.random());
        setLoading(percent);
        if (percent > 91) {
          clearInterval(interval);
        }
      }, 2000);
    }
  }, 100);

  function clear() {
    clearInterval(interval);
    setLoading(100);
  }

  function dispose() {
    disposed = true;
    clearTimeout(deadline);
    clearInterval(interval);
    if (rafId !== undefined) cancelAnimationFrame(rafId);
  }

  // Count up to 100 at the old pace (a 2ms interval runs at ~4ms once the
  // browser clamps it), but set React state at most once per frame
  // Idempotent: the deadline and the scene may both call it
  function loaded() {
    loadedPromise ??= new Promise<number>((resolve) => {
      if (disposed) return;
      clearTimeout(deadline);
      clearInterval(interval);
      let last = performance.now();
      const step = (now: number) => {
        if (disposed) return;
        // Capped like the old interval, which could not catch up after a blocked frame
        const advance = Math.min(4, Math.max(1, Math.round((now - last) / 4)));
        last = now;
        percent = Math.min(100, percent + advance);
        setLoading(percent);
        if (percent < 100) {
          rafId = requestAnimationFrame(step);
        } else {
          resolve(percent);
        }
      };
      rafId = requestAnimationFrame(step);
    });
    return loadedPromise;
  }
  return { loaded, percent, clear, dispose };
};
