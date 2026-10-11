import { NAME, projects, Route, SITE } from "./data";

// The <head> tags for one prerendered page: title, description, canonical,
// Open Graph / Twitter and JSON-LD (breadcrumbs only as data, never visible)
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// "</" can't appear inside the JSON-LD script tag
const jsonLd = (data: object) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

const breadcrumb = (items: Array<[string, string]>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, item], i) => ({
    "@type": "ListItem",
    position: i + 1,
    name,
    item,
  })),
});

export function headFor(route: Route): string {
  let path: string, title: string, description: string, image: string, imageAlt: string;
  let ld: object[];

  if (route.kind === "index") {
    path = "/projects";
    title = `Projects | ${NAME}`;
    description = `Projects by ${NAME}, Software Engineer at GE HealthCare: ${projects
      .map((p) => `${p.title} (${p.category})`)
      .join(", ")}.`;
    image = "/images/og-image.jpg";
    imageAlt = `${NAME}'s projects`;
    ld = [
      breadcrumb([
        ["Home", `${SITE}/`],
        ["Projects", `${SITE}/projects`],
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: title,
        url: `${SITE}/projects`,
        description,
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
    ];
  } else {
    const p = route.project;
    path = `/projects/${p.slug}`;
    title = `${p.title}: ${p.category} | ${NAME}`;
    description =
      p.description ||
      `${p.title}, a ${p.category.toLowerCase()} project by ${NAME}. Tools: ${p.tools}.`;
    image = `/images/${p.image}-1600.webp`;
    imageAlt = p.title;
    ld = [
      breadcrumb([
        ["Home", `${SITE}/`],
        ["Projects", `${SITE}/projects`],
        [p.title, `${SITE}${path}`],
      ]),
    ];
  }

  const url = `${SITE}${path}`;
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${SITE}${image}" />`,
    `<meta property="og:image:alt" content="${esc(imageAlt)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${NAME}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${SITE}${image}" />`,
    `<meta name="twitter:image:alt" content="${esc(imageAlt)}" />`,
    ...ld.map(jsonLd),
  ].join("\n  ");
}
