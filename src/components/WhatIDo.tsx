import { useEffect, useRef } from "react";
import "./styles/WhatIDo.css";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import onDebouncedResize from "./utils/debouncedResize";

const WhatIDo = () => {
  const containerRef = useRef<(HTMLDivElement | null)[]>([]);
  const boxInRef = useRef<HTMLDivElement | null>(null);
  const setRef = (el: HTMLDivElement | null, index: number) => {
    containerRef.current[index] = el;
  };
  useEffect(() => {
    const isTouch = ScrollTrigger.isTouch || "ontouchstart" in window;

    // Store stable references so cleanup can remove the exact same listeners
    const clickHandlers: Array<{ el: HTMLDivElement; handler: () => void }> = [];

    // Keyboard: Enter/Space toggle a box the same way a tap does
    const keyHandlers: Array<{ el: HTMLDivElement; handler: (e: KeyboardEvent) => void }> = [];
    containerRef.current.forEach((container) => {
      if (!container) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        handleClick(container);
      };
      keyHandlers.push({ el: container, handler });
      container.addEventListener("keydown", handler);
    });

    if (isTouch) {
      containerRef.current.forEach((container) => {
        if (container) {
          container.classList.remove("what-noTouch");
          const handler = () => handleClick(container);
          clickHandlers.push({ el: container, handler });
          container.addEventListener("click", handler);
        }
      });
    }

    // Mobile (<= 1024px): reveal .what-box-in with fade + trigger sub-animations.
    // Checked per call, not once at mount: an iPad window resized across 1024px
    // must still get the reveal (the desktop layout shows the box via GSAP instead)
    const boxIn = boxInRef.current;
    let revealed = false;

    const checkReveal = () => {
      if (revealed || !boxIn || window.innerWidth > 1024) return;
      const rect = boxIn.getBoundingClientRect();
      // Also when already scrolled past (a resize below 1024px further down the page)
      if (rect.top < window.innerHeight * 0.85) {
        revealed = true;
        boxIn.style.transition = "opacity 0.6s ease";
        boxIn.style.opacity = "1";
        setTimeout(() => boxIn.classList.add("revealed"), 100);
        window.removeEventListener("scroll", checkReveal, true);
        removeResize();
      }
    };

    window.addEventListener("scroll", checkReveal, true);
    const removeResize = onDebouncedResize(checkReveal);
    checkReveal();

    return () => {
      window.removeEventListener("scroll", checkReveal, true);
      removeResize();
      // Remove with the exact same function references
      clickHandlers.forEach(({ el, handler }) => {
        el.removeEventListener("click", handler);
      });
      keyHandlers.forEach(({ el, handler }) => el.removeEventListener("keydown", handler));
    };
  }, []);

  // The box is a fixed height per breakpoint, and a closed card gets half of it.
  // When a closed card's title + description need more than that (BACKEND &
  // AUTOMATION wraps, and narrow phones wrap the text more), raise the box's
  // min-height so every description shows in full and clears the arrow button
  useEffect(() => {
    const boxIn = boxInRef.current;
    if (!boxIn) return;
    const fit = () => {
      const cards = containerRef.current.filter((c): c is HTMLDivElement => !!c);
      // Only measure the resting state: an open card has different padding
      const busy = cards.some(
        (c) =>
          c.matches(":hover") ||
          c.classList.contains("what-content-active") ||
          c.classList.contains("what-sibling")
      );
      if (busy || getComputedStyle(boxIn).display === "none") return;
      let need = 0;
      cards.forEach((card) => {
        const text = card.querySelector("p");
        if (!text) return;
        const style = getComputedStyle(card);
        const top = card.getBoundingClientRect().top;
        // Text end, from the card's top (top padding included)
        const textEnd = text.getBoundingClientRect().bottom - top;
        // The arrow sits in the bottom-right corner, inside the bottom padding
        const arrow = card.querySelector(".what-arrow");
        const arrowSpace = arrow
          ? card.getBoundingClientRect().bottom - arrow.getBoundingClientRect().top + 8
          : 0;
        const bottom = Math.max(parseFloat(style.paddingBottom) || 0, arrowSpace);
        need = Math.max(need, textEnd + bottom);
      });
      // Closed cards are min-height: 50% of the box
      boxIn.style.minHeight = need ? `${Math.ceil(need * 2)}px` : "";
    };
    // Also runs when the box first shows (desktop reveals it from display: none)
    // and on width changes; the text end doesn't depend on the box height, so
    // setting the min-height settles after one extra call
    const observer = new ResizeObserver(fit);
    observer.observe(boxIn);
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="whatIDO">
      <div className="what-box">
        <h2 className="title">
          W<span className="hat-h2">HAT</span>
          <div>
            I<span className="do-h2"> DO</span>
          </div>
        </h2>
      </div>
      <div className="what-box">
        <div className="what-box-in" ref={boxInRef}>
          <div className="what-border2" aria-hidden="true">
            <svg width="100%">
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="100%"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="7,7"
              />
              <line
                x1="100%"
                y1="0"
                x2="100%"
                y2="100%"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="7,7"
              />
            </svg>
          </div>
          <div
            className="what-content what-noTouch"
            ref={(el) => setRef(el, 0)}
            role="button"
            tabIndex={0}
            aria-expanded="false"
          >
            <div className="what-border1" aria-hidden="true">
              <svg height="100%">
                <line
                  x1="0"
                  y1="0"
                  x2="100%"
                  y2="0"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />
                <line
                  x1="0"
                  y1="100%"
                  x2="100%"
                  y2="100%"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />
              </svg>
            </div>
            <div className="what-corner" aria-hidden="true"></div>

            <div className="what-content-in">
              <h3>FRONTEND</h3>
              <h4>Building Interactive UIs</h4>
              <p>
                Crafting performant, responsive interfaces with modern frameworks.
                From SPAs to full-stack web apps, I deliver polished user experiences.
              </p>
              <h5>Skillset & tools</h5>
              <div className="what-content-flex">
                <div className="what-tags">React</div>
                <div className="what-tags">JavaScript</div>
                <div className="what-tags">TypeScript</div>
                <div className="what-tags">HTML5</div>
                <div className="what-tags">CSS3</div>
                <div className="what-tags">Tkinter</div>
              </div>
              <div className="what-arrow" aria-hidden="true"></div>
            </div>
          </div>
          <div
            className="what-content what-noTouch"
            ref={(el) => setRef(el, 1)}
            role="button"
            tabIndex={0}
            aria-expanded="false"
          >
            <div className="what-border1" aria-hidden="true">
              <svg height="100%">
                <line
                  x1="0"
                  y1="100%"
                  x2="100%"
                  y2="100%"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />
              </svg>
            </div>
            <div className="what-corner" aria-hidden="true"></div>
            <div className="what-content-in">
              <h3>BACKEND & AUTOMATION</h3>
              <h4>Scalable Solutions & Tooling</h4>
              <p>
                Building automation tools, APIs, and backend systems. From
                network health checks to RPA agents, I build software that
                streamlines operations.
              </p>
              <h5>Skillset & tools</h5>
              <div className="what-content-flex">
                <div className="what-tags">Python</div>
                <div className="what-tags">Java</div>
                <div className="what-tags">C++</div>
                <div className="what-tags">SQL</div>
                <div className="what-tags">Node.js</div>
                <div className="what-tags">Express</div>
                <div className="what-tags">Selenium</div>
                <div className="what-tags">AWS</div>
              </div>
              <div className="what-arrow" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatIDo;

function handleClick(container: HTMLDivElement) {
  const active = container.classList.toggle("what-content-active");
  container.setAttribute("aria-expanded", String(active));
  container.classList.remove("what-sibling");
  if (container.parentElement) {
    const siblings = Array.from(container.parentElement.children);

    siblings.forEach((sibling) => {
      if (sibling !== container) {
        sibling.classList.remove("what-content-active");
        if (sibling.hasAttribute("aria-expanded")) sibling.setAttribute("aria-expanded", "false");
        sibling.classList.toggle("what-sibling");
      }
    });
  }
}
