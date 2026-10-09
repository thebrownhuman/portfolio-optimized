import { useEffect } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HoverLinks from "./HoverLinks";
import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import "./styles/Navbar.css";
import {
  scrollMode,
  showScrollBadge,
  smootherSettings,
  usesSmoother,
} from "./utils/scrollMode";
import { prefersReducedMotion } from "./utils/reducedMotion";

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);
// undefined in the native scroll modes (?scroll=native|hybrid)
export let smoother: ScrollSmoother | undefined;

// Lock scrolling until the intro finishes (initialFX unlocks it)
export function setScrollPaused(paused: boolean) {
  smoother?.paused(paused);
}

function scrollToSection(section: string) {
  if (smoother) smoother.scrollTo(section, true, "top top");
  else document.querySelector(section)?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
}

const Navbar = () => {
  useEffect(() => {
    if (usesSmoother) {
      smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        ...smootherSettings,
        effects: false,
        smoothTouch: false,
        autoResize: true,
        ignoreMobileResize: true,
      });
      smoother.scrollTop(0);
    } else {
      window.scrollTo(0, 0);
    }
    if (scrollMode === "normalize") ScrollTrigger.normalizeScroll(true);
    setScrollPaused(true);

    const clickHandlers: Array<{ el: HTMLElement; handler: (e: Event) => void }> = [];
    let links = document.querySelectorAll(".header ul a");
    links.forEach((elem) => {
      let element = elem as HTMLAnchorElement;
      const handler = (e: Event) => {
        e.preventDefault();
        let section = element.getAttribute("data-href");
        if (section) scrollToSection(section);
      };
      element.addEventListener("click", handler);
      clickHandlers.push({ el: element, handler });
    });

    return () => {
      clickHandlers.forEach(({ el, handler }) => el.removeEventListener("click", handler));
      smoother?.kill();
      smoother = undefined;
      if (scrollMode === "normalize") ScrollTrigger.normalizeScroll(false);
    };
  }, []);
  return (
    <>
      {showScrollBadge && <div className="scroll-mode-badge">scroll: {scrollMode}</div>}
      <div className="header">
        <a href="/#" className="navbar-title" data-cursor="disable">
          SM
        </a>
        <a
          href="mailto:thebrownhuman@gmail.com"
          className="navbar-connect"
          data-cursor="disable"
        >
          thebrownhuman@gmail.com
        </a>
        <ul>
          <li>
            <a data-href="#about" href="#about">
              <HoverLinks text="ABOUT" />
            </a>
          </li>
          <li>
            <a data-href="#work" href="#work">
              <HoverLinks text="WORK" />
            </a>
          </li>
          <li>
            <a data-href="#contact" href="#contact">
              <HoverLinks text="CONTACT" />
            </a>
          </li>
        </ul>
      </div>

      <div className="landing-circle1"></div>
      <div className="landing-circle2"></div>
      <div className="nav-fade"></div>
    </>
  );
};

export default Navbar;
