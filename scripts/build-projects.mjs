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

// Inline the page's CSS (about 20KB raw, 6KB gzipped): four render-blocking
// stylesheet requests held the first paint ~0.4s on a mobile connection
template = template.replace(
  /<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g,
  (_, file) => `<style>${readFileSync(join(dist, file), "utf8").trim()}</style>`
);

// The page is complete as HTML, so its JS (hydration: cursor, smooth scroll,
// reveals) and the home prefetches wait for the load event and first paint. As plain tags they
// were requested ahead of the LCP image, and Lighthouse's mobile model counted
// their download against LCP
const entry = template.match(/<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"><\/script>/);
if (!entry) throw new Error("build-projects: no module script in projects.html");
const preloads = [...template.matchAll(/<link rel="modulepreload" crossorigin href="(\/assets\/[^"]+)">/g)].map(
  (m) => m[1]
);
const prefetch = [...homeFiles]
  .map((file) => `/${file}`)
  .filter((file) => !preloads.includes(file) && file !== entry[1]);
// Started once the page has loaded and painted (the paint timing entry), so
// the content always shows first; the entrance animations are CSS for that
const loader = `<script>(function(){var d=document,n=0,go=function(){if(++n<2)return;var s=d.createElement("script");s.type="module";s.src=${JSON.stringify(
  entry[1]
)};d.head.append(s);${JSON.stringify(
  prefetch
)}.forEach(function(h){var l=d.createElement("link");l.rel="prefetch";l.href=h;d.head.append(l)})};addEventListener("load",go);try{new PerformanceObserver(function(l,o){o.disconnect();go()}).observe({type:"paint",buffered:true})}catch(e){go()}})()</script>`;
template = template.replace(entry[0], loader).replace(/\s*<link rel="modulepreload" crossorigin href="[^"]+">/g, "");

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
