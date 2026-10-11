import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import Cursor from "../components/Cursor";
import SocialIcons from "../components/SocialIcons";
import HoverLinks from "../components/HoverLinks";
import Contact from "../components/Contact";
import { smootherSettings, usesSmoother } from "../components/utils/scrollMode";
import { prefersReducedMotion } from "../components/utils/reducedMotion";
import { Route } from "./data";
import ProjectsIndex from "./ProjectsIndex";
import ProjectDetail from "./ProjectDetail";
import "../components/styles/Navbar.css";
import "../components/styles/Landing.css";
import "./projects.css";

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);

// The /projects pages: the home page's frame (navbar, glows, cursor, social
// icons, contact, smooth scroll) around the project content, without the 3D
// character or the intro. Prerendered to HTML at build time and hydrated here.
const ProjectsApp = ({ route }: { route: Route }) => {
  useEffect(() => {
    let smoother: ScrollSmoother | undefined;
    if (usesSmoother) {
      smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        ...smootherSettings,
        smoothTouch: false,
        autoResize: true,
        ignoreMobileResize: true,
      });
    }

    // In-page nav links (CONTACT, and PROJECTS on /projects itself: "top")
    // scroll like the home page; the rest are page loads
    const links = [...document.querySelectorAll<HTMLAnchorElement>(".header ul a[data-href]")];
    const onClick = (e: Event) => {
      const target = (e.currentTarget as HTMLElement).getAttribute("data-href")!;
      e.preventDefault();
      const behavior = prefersReducedMotion ? "auto" : "smooth";
      if (target === "top") {
        if (smoother) smoother.scrollTo(0, true);
        else window.scrollTo({ top: 0, behavior });
      } else if (smoother) smoother.scrollTo(target, true, "top top");
      else document.querySelector(target)?.scrollIntoView({ behavior, block: "start" });
    };
    links.forEach((a) => a.addEventListener("click", onClick));

    // Scroll reveals. Without JS the prerendered HTML is fully visible (the
    // hiding CSS needs the "js" class), so no-JS visitors never see an empty page
    const ctx = gsap.context(() => {
      if (prefersReducedMotion) return;
      // The hero and the first image (data-reveal="lcp") animate in with CSS
      // (projects.css), as soon as the page paints; this script loads after
      // that. projects.html's CSS holds the other rows at opacity 0 until here
      gsap.utils.toArray<HTMLElement>('[data-reveal]:not([data-reveal="lcp"])').forEach((el) => {
        gsap.fromTo(
          el,
          { y: 80, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          }
        );
      });
    });

    return () => {
      links.forEach((a) => a.removeEventListener("click", onClick));
      ctx.revert();
      smoother?.kill();
    };
  }, []);

  return (
    <div className="container-main pj-page">
      <a className="skip-link" href="#pj-content">
        Skip to content
      </a>
      <Cursor />
      <div className="header">
        <a href="mailto:thebrownhuman@gmail.com" className="navbar-connect" data-cursor="disable">
          thebrownhuman@gmail.com
        </a>
        <ul>
          <li>
            {/* Home from the top; in a tab that has seen the intro, no loader */}
            <a href="/">
              <HoverLinks text="PORTFOLIO" />
            </a>
          </li>
          <li>
            {route.kind === "index" ? (
              <a href="/projects" data-href="top" aria-current="page">
                <HoverLinks text="PROJECTS" />
              </a>
            ) : (
              <a href="/projects">
                <HoverLinks text="PROJECTS" />
              </a>
            )}
          </li>
          <li>
            <a data-href="#contact" href="#contact">
              <HoverLinks text="CONTACT" />
            </a>
          </li>
        </ul>
      </div>
      <SocialIcons />
      <div className="landing-circle1" aria-hidden="true"></div>
      <div className="landing-circle2" aria-hidden="true"></div>
      <div className="nav-fade" aria-hidden="true"></div>

      <div id="smooth-wrapper">
        <div id="smooth-content">
          <main id="pj-content" tabIndex={-1}>
            {route.kind === "index" ? (
              <ProjectsIndex />
            ) : (
              <ProjectDetail project={route.project} index={route.index} />
            )}
          </main>
          <Contact />
        </div>
      </div>
    </div>
  );
};

export default ProjectsApp;
