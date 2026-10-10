import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import Loading from "../components/Loading";
import { debugFlag } from "../components/utils/debugProbe";

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
        !loaderGone && <Loading percent={loading} fading={!isLoading} />
      )}
      <main className="main-body">{children}</main>
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
