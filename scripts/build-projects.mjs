// Prerenders /projects and /projects/<slug> after `vite build`: each page gets
// the full React-rendered HTML and its own <head> tags, so crawlers see the
// content without JS; src/projects/main.tsx then hydrates it in the browser.
//   1. SSR-build src/projects/render.tsx into a temp folder
//   2. Fill dist/projects.html (the client template, with hashed assets) once
//      per page and write dist/projects[/<slug>]/index.html
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";
import react from "@vitejs/plugin-react";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const ssrOut = join(root, "node_modules/.cache/projects-ssr");

await build({
  root,
  configFile: false,
  logLevel: "warn",
  plugins: [react()],
  build: {
    ssr: "src/projects/render.tsx",
    outDir: ssrOut,
    emptyOutDir: true,
  },
});

const { render, paths } = await import(pathToFileURL(join(ssrOut, "render.js")).href);
const templateFile = join(dist, "projects.html");
const template = readFileSync(templateFile, "utf8");

for (const path of paths) {
  const { head, html } = render(path);
  const file = join(dist, path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, template.replace("<!--head-->", head).replace("<!--app-->", html));
}

// Only the prerendered copies are served
rmSync(templateFile);
rmSync(ssrOut, { recursive: true, force: true });
console.log(`build-projects: prerendered ${paths.join(", ")}`);
