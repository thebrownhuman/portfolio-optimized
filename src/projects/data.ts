import projectsJson from "../data/projects.json";

export type Project = {
  slug: string;
  title: string;
  category: string;
  tools: string;
  image: string;
  // 3-5 sentences; empty hides the Overview section
  description: string;
  // Live demo URL; only rendered when present
  link?: string;
};

export const projects: Project[] = projectsJson;

export const SITE = "https://shivanshmishra.com";
export const NAME = "Shivansh Mishra";

// "/projects", "/projects/" and "/projects.html" (dev) are the index; a slug path
// that matches no project is undefined (nginx 404s those before they get here)
export type Route =
  | { kind: "index" }
  | { kind: "project"; project: Project; index: number };

export function routeFor(pathname: string): Route | undefined {
  const path = pathname.replace(/\.html$/, "").replace(/\/+$/, "");
  if (path === "/projects") return { kind: "index" };
  const slug = path.match(/^\/projects\/([^/]+)$/)?.[1];
  const index = projects.findIndex((p) => p.slug === slug);
  return index >= 0 ? { kind: "project", project: projects[index], index } : undefined;
}

export const toolList = (p: Project) => p.tools.split(",").map((t) => t.trim());

export const imageSrcSet = (image: string) =>
  `/images/${image}-900.webp 900w, /images/${image}-1600.webp 1600w`;

export const pad = (n: number) => String(n).padStart(2, "0");
