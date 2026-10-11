import { lazy, Suspense } from "react";
import "./App.css";

const MainContainer = lazy(() => import("./components/MainContainer"));
// Poster + the deferred 3D scene; the scene's own chunk loads only after idle
const CharacterStage = lazy(() => import("./components/Character/CharacterStage"));
import { LoadingProvider } from "./context/LoadingProvider";
import ErrorBoundary from "./components/ErrorBoundary";

const App = () => {
  return (
    <ErrorBoundary>
      <LoadingProvider>
        <Suspense fallback={<div style={{background: '#0a0e17', width: '100vw', height: '100vh'}} />}>
          <MainContainer>
            <CharacterStage />
          </MainContainer>
        </Suspense>
      </LoadingProvider>
    </ErrorBoundary>
  );
};

export default App;
