// Turns the Vite build (dist/) into the Cloudflare Pages layout, in place.
// Run after `npm run build`, only for the Pages deploy: the nginx image uses dist as built.
//
// - The prerendered project pages are folders (projects/<slug>/index.html), which
//   nginx serves at /projects/<slug>. Pages would serve a folder at /projects/<slug>/
//   and 308-redirect the canonical URL (no trailing slash) there, so they become
//   projects.html and projects/<slug>.html, which Pages serves at exactly
//   /projects and /projects/<slug> (and redirects the .html and slash forms to them).
// - Copies cloudflare/_headers (the nginx cache and security headers).
// - Fails if the character model is a Git LFS pointer instead of the real file.
import { copyFileSync, existsSync, readdirSync, readFileSync, renameSync, rmdirSync, statSync } from "node:fs";
import { join } from "node:path";

const dist = "dist";
const projects = join(dist, "projects");

if (existsSync(projects)) {
  for (const name of readdirSync(projects)) {
    const dir = join(projects, name);
    if (!statSync(dir).isDirectory()) continue;
    renameSync(join(dir, "index.html"), join(projects, `${name}.html`));
    rmdirSync(dir);
  }
  renameSync(join(projects, "index.html"), join(dist, "projects.html"));
}

copyFileSync(join("cloudflare", "_headers"), join(dist, "_headers"));

const glb = readdirSync(join(dist, "assets")).filter((f) => f.endsWith(".glb"));
if (glb.length === 0) throw new Error("pages-dist: no .glb in dist/assets");
for (const f of glb) {
  const magic = readFileSync(join(dist, "assets", f)).subarray(0, 4).toString("latin1");
  if (magic !== "glTF") throw new Error(`pages-dist: ${f} is not a glTF binary (Git LFS pointer?)`);
}

console.log("pages-dist: dist/ ready for Cloudflare Pages");
