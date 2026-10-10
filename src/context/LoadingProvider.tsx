import {
  createContext,
  PropsWithChildren,
  useContext,
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

const LoadingContext = createContext<LoadingType | null>(null);

export const LoadingProvider = ({ children }: PropsWithChildren) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loading, setLoading] = useState(0);

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
        isLoading && <Loading percent={loading} />
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
