import {
  lazy,
  PropsWithChildren,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal, flushSync } from "react-dom";
import About from "./About";
import Career from "./Career";
import Contact from "./Contact";
import Cursor from "./Cursor";
import Landing from "./Landing";
import Navbar from "./Navbar";
import SocialIcons from "./SocialIcons";
import WhatIDo from "./WhatIDo";
import Work from "./Work";
import TechStackLite from "./TechStackLite";
import { span } from "./utils/perfSpan";
import setSplitText from "./utils/splitText";
import onDebouncedResize from "./utils/debouncedResize";

const TechStack = lazy(() => import("./TechStack"));

const MainContainer = ({ children }: PropsWithChildren) => {
  const [isDesktopView, setIsDesktopView] = useState<boolean>(
    window.innerWidth > 1024
  );
  // The character renders into one detached node that moves between the desktop
  // slot (fixed, over the page) and the mobile slot (inside the landing). Moving
  // the node instead of rendering the children in two places keeps a single Scene
  // across the 1024px breakpoint: no model reload, no second canvas, no reset pose
  const [charHost] = useState(() => {
    const el = document.createElement("div");
    el.style.display = "contents";
    return el;
  });
  const desktopSlot = useRef<HTMLDivElement>(null);
  const mobileSlot = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const slot = (isDesktopView ? desktopSlot : mobileSlot).current;
    if (slot && charHost.parentNode !== slot) slot.appendChild(charHost);
  }, [isDesktopView, charHost]);

  useEffect(() => {
    const resizeHandler = () => {
      span("setSplitText", setSplitText);
      // Commit the layout swap now, so the timelines rebuilt and the
      // ScrollTrigger.refresh that follow this callback measure the new layout
      flushSync(() => setIsDesktopView(window.innerWidth > 1024));
    };
    span("setSplitText", setSplitText);
    return onDebouncedResize(resizeHandler);
  }, []);

  return (
    <div className="container-main">
      <a className="skip-link" href="#landingDiv">
        Skip to content
      </a>
      <Cursor />
      <Navbar />
      <SocialIcons />
      {createPortal(children, charHost)}
      <div ref={desktopSlot} style={{ display: "contents" }} />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <div className="container-main">
            <Landing>
              <div ref={mobileSlot} style={{ display: "contents" }} />
            </Landing>
            <About />
            <WhatIDo />
            <Career />
            <Work />
            {isDesktopView ? (
              <Suspense fallback={<div>Loading....</div>}>
                <TechStack />
              </Suspense>
            ) : (
              <TechStackLite />
            )}
            <Contact />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContainer;
