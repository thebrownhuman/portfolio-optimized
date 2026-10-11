import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import ProjectsApp from "./ProjectsApp";
import { projects, routeFor } from "./data";
import { headFor } from "./meta";

// Build-time only (scripts/build-projects.mjs): the HTML and <head> tags of
// every /projects page
export const paths = ["/projects", ...projects.map((p) => `/projects/${p.slug}`)];

export function render(path: string) {
  const route = routeFor(path);
  if (!route) throw new Error(`No project page for ${path}`);
  return {
    head: headFor(route),
    html: renderToString(
      <StrictMode>
        <ProjectsApp route={route} />
      </StrictMode>
    ),
  };
}
