// Prerenders /projects and /projects/<slug> as static HTML into dist/ after
// `vite build`, so the pages are crawlable without JS. Uses only the Work
// section data (src/data/projects.json): title, category, tools, image.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const projects = JSON.parse(
  readFileSync(join(root, "src/data/projects.json"), "utf8")
);

const SITE = "https://shivanshmishra.com";
const NAME = "Shivansh Mishra";

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// "</" can't appear inside the JSON-LD script tag
const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

const breadcrumb = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, url], i) => ({
    "@type": "ListItem",
    position: i + 1,
    name,
    item: url,
  })),
});

const imgSrcset = (image) =>
  `/images/${image}-900.webp 900w, /images/${image}-1600.webp 1600w`;

const STYLE = `
@font-face{font-family:"Geist";font-style:normal;font-display:swap;font-weight:100 900;src:url("/fonts/geist-latin-wght.woff2") format("woff2")}
:root{--accent:#5eead4;--bg:#0a0e17;--text:#eae5ec;--muted:#adacac;--line:rgba(255,255,255,.15)}
*{box-sizing:border-box}
html{background:var(--bg);color-scheme:dark}
body{margin:0;background:var(--bg);color:var(--text);font-family:"Geist",Arial,sans-serif;line-height:1.5}
a{color:inherit}
a:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.wrap{width:min(1100px,100% - 32px);margin:0 auto;padding:28px 0 64px}
header{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:48px;font-size:14px;letter-spacing:1px}
header a{text-decoration:none;font-weight:600}
.logo{font-size:18px}
nav ol{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0 0 16px;padding:0;font-size:14px;color:var(--muted)}
nav li+li::before{content:"/";margin-right:8px}
nav a{text-decoration:none}nav a:hover{color:var(--accent)}
h1{font-size:clamp(36px,7vw,64px);line-height:1.05;margin:0 0 12px;font-weight:600}
.kicker{color:var(--accent);text-transform:uppercase;letter-spacing:4px;font-size:14px;margin:0 0 12px}
.category{font-size:20px;color:var(--muted);margin:0 0 32px;font-weight:300}
.shot{width:100%;height:auto;aspect-ratio:1600/873;object-fit:cover;border-radius:12px;border:1px solid var(--line);background:#111827;display:block}
.tools-label{text-transform:uppercase;letter-spacing:2px;font-size:13px;color:var(--muted);margin:32px 0 12px}
.tools{display:flex;flex-wrap:wrap;gap:10px;list-style:none;margin:0;padding:0}
.tools li{border:1px solid var(--line);border-radius:999px;padding:6px 14px;font-size:15px}
.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:40px}
.btn{display:inline-flex;align-items:center;min-height:44px;padding:0 20px;border-radius:999px;border:1px solid var(--line);text-decoration:none;font-weight:500}
.btn:hover{border-color:var(--accent);color:var(--accent)}
.btn-primary{background:var(--accent);border-color:var(--accent);color:#0a0e17}
.btn-primary:hover{color:#0a0e17;filter:brightness(1.1)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;list-style:none;margin:32px 0 0;padding:0}
.card a{display:block;text-decoration:none;border:1px solid var(--line);border-radius:14px;overflow:hidden;transition:border-color .3s}
.card a:hover{border-color:var(--accent)}
.card .shot{border:0;border-radius:0}
.card-body{padding:16px 18px 20px}
.card h2{margin:0 0 4px;font-size:22px;font-weight:600}
.card p{margin:0;color:var(--muted);font-size:15px}
.intro{color:var(--muted);max-width:640px;margin:0}
footer{margin-top:64px;padding-top:24px;border-top:1px solid var(--line);font-size:14px;color:var(--muted)}
`;

const page = ({ path, title, description, image, imageAlt, body, ld }) => {
  const url = `${SITE}${path}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="dark" />
<meta name="theme-color" content="#0a0e17" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${url}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${SITE}${image}" />
<meta property="og:image:alt" content="${esc(imageAlt)}" />
<meta property="og:url" content="${url}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${NAME}" />
<meta property="og:locale" content="en_US" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${SITE}${image}" />
<meta name="twitter:image:alt" content="${esc(imageAlt)}" />
<link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png" />
<link rel="preload" href="/fonts/geist-latin-wght.woff2" as="font" type="font/woff2" crossorigin />
<style>${STYLE.trim()}</style>
${ld.map(jsonLd).join("\n")}
</head>
<body>
<div class="wrap">
<header><a class="logo" href="/">SM</a><a href="/">Home</a></header>
<main>
${body}
</main>
<footer>© ${NAME}. <a href="/">shivanshmishra.com</a></footer>
</div>
</body>
</html>
`;
};

const write = (rel, html) => {
  const file = join(dist, rel, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
};

// /projects
const listTitle = `Projects | ${NAME}`;
const listDesc = `Projects by ${NAME}, Software Engineer: ${projects
  .map((p) => p.title)
  .join(", ")}.`;
write(
  "projects",
  page({
    path: "/projects",
    title: listTitle,
    description: listDesc,
    image: "/images/og-image.jpg",
    imageAlt: `${NAME}'s projects`,
    ld: [
      breadcrumb([
        ["Home", `${SITE}/`],
        ["Projects", `${SITE}/projects`],
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: listTitle,
        url: `${SITE}/projects`,
        description: listDesc,
        author: { "@id": `${SITE}/#person` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: projects.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE}/projects/${p.slug}`,
            name: p.title,
          })),
        },
      },
    ],
    body: `<nav aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li aria-current="page">Projects</li></ol></nav>
<h1>Projects</h1>
<p class="intro">Selected work by ${NAME}.</p>
<ul class="grid">
${projects
  .map(
    (p, i) => `<li class="card"><a href="/projects/${p.slug}">
<img class="shot" src="/images/${p.image}-900.webp" srcset="${imgSrcset(p.image)}" sizes="(max-width: 700px) 100vw, 360px" width="900" height="491" alt="${esc(p.title)}" ${i > 1 ? 'loading="lazy" ' : ""}decoding="async" />
<div class="card-body"><h2>${esc(p.title)}</h2><p>${esc(p.category)}</p></div>
</a></li>`
  )
  .join("\n")}
</ul>`,
  })
);

// /projects/<slug>
for (const p of projects) {
  const path = `/projects/${p.slug}`;
  const tools = p.tools.split(",").map((t) => t.trim());
  const title = `${p.title}: ${p.category} | ${NAME}`;
  const description = `${p.title}, a ${p.category.toLowerCase()} project by ${NAME}. Tools: ${p.tools}.`;
  // Only rendered if the data ever gets a link (none today)
  const demo = p.link
    ? `<a class="btn btn-primary" href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">Live demo</a>`
    : "";
  write(
    path.slice(1),
    page({
      path,
      title,
      description,
      image: `/images/${p.image}-1600.webp`,
      imageAlt: p.title,
      ld: [
        breadcrumb([
          ["Home", `${SITE}/`],
          ["Projects", `${SITE}/projects`],
          [p.title, `${SITE}${path}`],
        ]),
      ],
      body: `<nav aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/projects">Projects</a></li><li aria-current="page">${esc(p.title)}</li></ol></nav>
<article>
<p class="kicker">Project</p>
<h1>${esc(p.title)}</h1>
<p class="category">${esc(p.category)}</p>
<img class="shot" src="/images/${p.image}-1600.webp" srcset="${imgSrcset(p.image)}" sizes="(max-width: 1100px) 100vw, 1100px" width="1600" height="873" alt="${esc(p.title)}" fetchpriority="high" />
<h2 class="tools-label">Tools &amp; Features</h2>
<ul class="tools">${tools.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
<div class="actions">${demo}<a class="btn" href="/projects">All projects</a><a class="btn" href="/#work">Back to home</a></div>
</article>`,
    })
  );
}

console.log(`build-projects: wrote /projects + ${projects.length} project pages`);
