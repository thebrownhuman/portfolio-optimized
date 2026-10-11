import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import Loading from "../components/Loading";
import { debugFlag } from "../components/utils/debugProbe";
import { skipIntro } from "../components/utils/introSkip";

// ?debug&norelease: keep the loader mounted (hidden) after the reveal
const keepLoader = debugFlag("norelease");

interface LoadingType {
  isLoading: boolean;
  setIsLoading: (state: boolean) => void;
  setLoading: (percent: number) => void;
}

// The loader fades out over the page's own fade-in (.main-active, 1s), so the
// view goes loader -> site without a black frame between them (iOS Safari)
const LOADER_FADE_MS = 1000;

const LoadingContext = createContext<LoadingType | null>(null);

export const LoadingProvider = ({ children }: PropsWithChildren) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(0);
  const [loaderGone, setLoaderGone] = useState(false);

  // Returning visit (introSkip.ts): no loader; reveal as soon as the landing is
  // mounted. The character rises in on its own once its model has loaded
  useEffect(() => {
    if (!skipIntro) return;
    let cancelled = false;
    let tries = 0;
    const reveal = async () => {
      let fx: (() => void) | undefined;
      try {
        fx = (await import("../components/utils/initialFX")).initialFX;
      } catch {
        fx = undefined;
      }
      const ready = () => {
        if (cancelled) return;
        // The landing chunk is still loading
        if (!document.querySelector(".landing-intro h1") && ++tries < 100) {
          setTimeout(ready, 50);
          return;
        }
        document.getElementsByTagName("main")[0]?.classList.remove("main-pending");
        if (fx) fx();
        else {
          document.body.style.overflowY = "auto";
          document.getElementsByTagName("main")[0]?.classList.add("main-active");
        }
        setIsLoading(false);
      };
      document.fonts.ready.then(ready);
    };
    reveal();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoading || keepLoader) return;
    const t = setTimeout(() => setLoaderGone(true), LOADER_FADE_MS);
    return () => clearTimeout(t);
  }, [isLoading]);

  const value = {
    isLoading,
    setIsLoading,
    setLoading,
  };
  return (
    <LoadingContext.Provider value={value as LoadingType}>
      {keepLoader ? (
        <div style={{ display: "contents", visibility: isLoading ? undefined : "hidden" }}>
          <Loading percent={loading} />
        </div>
      ) : (
        !skipIntro && !loaderGone && <Loading percent={loading} fading={!isLoading} />
      )}
      {/* Without the loader on top, the page stays hidden until it is revealed
          (otherwise the landing would show, then jump to the #section) */}
      {/* The class never changes in React: initialFX adds main-active itself, and a
          re-render with a new className would wipe it */}
      <main className={skipIntro ? "main-body main-pending" : "main-body"}>
        {children}
      </main>
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
