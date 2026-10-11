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

// Prefetch the home page's own code (entry, page shell, intro), so a nav link
// back home starts at once. Not the 3D character's chunks (three, rapier:
// megabytes, and the page shows without them)
const manifestDir = join(dist, ".vite");
const manifest = JSON.parse(readFileSync(join(manifestDir, "manifest.json"), "utf8"));
const homeFiles = new Set();
const collect = (key) => {
  const chunk = manifest[key];
  if (!chunk || homeFiles.has(chunk.file)) return;
  homeFiles.add(chunk.file);
  chunk.css?.forEach((css) => homeFiles.add(css));
  chunk.imports?.forEach(collect);
};
collect("index.html");
["src/components/MainContainer.tsx", "src/components/utils/initialFX.ts"].forEach(collect);
rmSync(manifestDir, { recursive: true, force: true });

let template = readFileSync(templateFile, "utf8");
const prefetch = [...homeFiles]
  .filter((file) => !template.includes(`/${file}"`))
  .map((file) => `<link rel="prefetch" href="/${file}" />`)
  .join("\n  ");
template = template.replace("</head>", `  ${prefetch}\n</head>`);

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
