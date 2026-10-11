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
// - live3D, first visit: the loader waits for the 3D scene, which plays its
//   intro at the reveal (as before); the poster is never shown
// - live3D, returning in the same tab (no loader): the poster rises in at once,
//   then crossfades to the 3D scene in the same pose once it has drawn
// - poster tier (deviceTier.ts): no loader; the poster rises in and stays
const CharacterStage = () => {
  const canvasDiv = useRef<HTMLDivElement>(null);
  const hoverDiv = useRef<HTMLDivElement>(null);
  const posterFirst = !live3D || skipIntro;
  const [poster, setPoster] = useState<"on" | "fading" | "off">(posterFirst ? "on" : "off");
  const [startScene, setStartScene] = useState(false);

  useEffect(() => {
    if (!live3D) {
      // Nothing waits on a scene; the page's scroll timelines run on stand-ins
      setPosterTimelines();
      return onDebouncedResize(setPosterTimelines);
    }
    let cancelled = false;
    afterIdle().then(() => !cancelled && setStartScene(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // The scene has drawn its first frame in the poster's pose: crossfade
  const onSceneReady = () => {
    setPoster((p) => (p === "on" ? "fading" : p));
  };
  useEffect(() => {
    if (poster !== "fading") return;
    const t = setTimeout(() => setPoster("off"), 700);
    return () => clearTimeout(t);
  }, [poster]);

  return (
    <>
      <div className="character-container" aria-hidden="true">
        <div
          className={`character-model${poster !== "off" ? " poster-on" : ""}${
            poster === "fading" ? " poster-fading" : ""
          }`}
          ref={canvasDiv}
        >
          {/* Clipped to the model's box: below it the glow is covered anyway (the
              ::before panel on phones, off screen on desktop), but contrast
              checks can't see pseudo-elements and read it behind the About title */}
          <div className="character-rim-clip">
            <div className="character-rim"></div>
          </div>
          <div className="character-hover" ref={hoverDiv}></div>
          {poster !== "off" && (
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
          <Scene
            canvasDiv={canvasDiv}
            hoverDiv={hoverDiv}
            handoff={posterFirst}
            onReady={onSceneReady}
          />
        </Suspense>
      )}
    </>
  );
};

export default CharacterStage;
