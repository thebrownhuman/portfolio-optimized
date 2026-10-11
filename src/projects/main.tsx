import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import ProjectsApp from "./ProjectsApp";
import { routeFor } from "./data";
import "../index.css";
import "../App.css";

// The page arrives prerendered (scripts/build-projects.mjs); this attaches React
const route = routeFor(window.location.pathname);
if (route) {
  hydrateRoot(
    document.getElementById("root")!,
    <StrictMode>
      <ProjectsApp route={route} />
    </StrictMode>
  );
}
