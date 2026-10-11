import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { live3D } from "../utils/deviceTier";
import { skipIntro } from "../utils/introSkip";
import { afterIdle } from "../utils/afterIdle";
import { setPosterTimelines } from "../utils/GsapScroll";
import onDebouncedResize from "../utils/debouncedResize";
import "./CharacterStage.css";

const Scene = lazy(() => import("./Scene"));

// The poster is the 3D scene's own landing frame (rendered from it, square,
// transparent), cropped to 2240x2400. The camera's vertical field of view is
// fixed, so at the canvas's full height and centred it lines up with the
// live canvas at any aspect ratio
const POSTER_WIDTHS = [560, 840, 1120, 1680];
const posterSet = (ext: string) =>
  POSTER_WIDTHS.map((w) => `/images/character-poster-${w}.${ext} ${w}w`).join(", ");
// Shown at the canvas height: 100vh (max 1080px) on desktop, 80vh below
const POSTER_SIZES = "(min-width: 1025px) calc(min(100vh, 1080px) * 0.9333), calc(80vh * 0.9333)";

// What the landing shows:
// - live3D: the 3D scene, with its real intro (the head raise) at the reveal:
//   behind the loader on a first visit, at once when returning in the same tab
//   (no loader; the model comes from the cache). The poster is never shown
// - poster tier (deviceTier.ts): no loader; the poster fades in and stays

// Desktop starts the scene at once: the pointer should move the head within a
// second of the reveal. Touch screens on a first visit wait for the page to
// settle (the loader is up meanwhile), which keeps mobile vitals as they were
const startNow = skipIntro || matchMedia("(hover: hover) and (pointer: fine)").matches;

const CharacterStage = () => {
  const canvasDiv = useRef<HTMLDivElement>(null);
  const hoverDiv = useRef<HTMLDivElement>(null);
  const [startScene, setStartScene] = useState(live3D && startNow);

  useEffect(() => {
    if (!live3D) {
      // Nothing waits on a scene; the page's scroll timelines run on stand-ins
      setPosterTimelines();
      return onDebouncedResize(setPosterTimelines);
    }
    if (startNow) return;
    let cancelled = false;
    afterIdle().then(() => !cancelled && setStartScene(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="character-container" aria-hidden="true">
        <div
          className={`character-model${live3D ? "" : " poster-on"}`}
          ref={canvasDiv}
        >
          {/* Clipped to the model's box: below it the glow is covered anyway (the
              ::before panel on phones, off screen on desktop), but contrast
              checks can't see pseudo-elements and read it behind the About title */}
          <div className="character-rim-clip">
            <div className="character-rim"></div>
          </div>
          <div className="character-hover" ref={hoverDiv}></div>
          {!live3D && (
            <picture>
              <source type="image/avif" srcSet={posterSet("avif")} sizes={POSTER_SIZES} />
              <img
                className="character-poster"
                src="/images/character-poster-840.webp"
                srcSet={posterSet("webp")}
                sizes={POSTER_SIZES}
                width={2240}
                height={2400}
                alt=""
                // React 18 doesn't know the camelCase prop yet
                {...{ fetchpriority: "high" }}
                decoding="async"
              />
            </picture>
          )}
        </div>
      </div>
      {startScene && (
        <Suspense fallback={null}>
          <Scene canvasDiv={canvasDiv} hoverDiv={hoverDiv} />
        </Suspense>
      )}
    </>
  );
};

export default CharacterStage;
