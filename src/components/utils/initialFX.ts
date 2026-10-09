import { SplitText } from "gsap/SplitText";
import gsap from "gsap";
import { setScrollPaused } from "../Navbar";
import { prefersReducedMotion } from "./reducedMotion";

// Reduced motion: the intro tweens jump to their end state
const t = (seconds: number) => (prefersReducedMotion ? 0 : seconds);

export function initialFX() {
  document.body.style.overflowY = "auto";
  setScrollPaused(false);
  document.getElementsByTagName("main")[0].classList.add("main-active");
  gsap.to("body", {
    backgroundColor: "#0a0e17",
    duration: t(0.5),
    delay: t(1),
  });

  var landingText = new SplitText(
    [".landing-info h3", ".landing-intro h2", ".landing-intro h1"],
    {
      type: "chars,lines",
      linesClass: "split-line",
    }
  );
  gsap.fromTo(
    landingText.chars,
    { opacity: 0, y: 80, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: t(1.2),
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: t(0.025),
      delay: t(0.3),
    }
  );

  let TextProps = { type: "chars,lines", linesClass: "split-h2" };

  var landingText2 = new SplitText(".landing-h2-info", TextProps);
  gsap.fromTo(
    landingText2.chars,
    { opacity: 0, y: 80, filter: "blur(5px)" },
    {
      opacity: 1,
      duration: t(1.2),
      filter: "blur(0px)",
      ease: "power3.inOut",
      y: 0,
      stagger: t(0.025),
      delay: t(0.3),
    }
  );

  gsap.fromTo(
    ".landing-info-h2",
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      duration: t(1.2),
      ease: "power1.inOut",
      y: 0,
      delay: t(0.8),
    }
  );
  gsap.fromTo(
    [".header", ".icons-section", ".nav-fade"],
    { opacity: 0 },
    {
      opacity: 1,
      duration: t(1.2),
      ease: "power1.inOut",
      delay: t(0.1),
    }
  );

  var landingText3 = new SplitText(".landing-h2-info-1", TextProps);
  var landingText4 = new SplitText(".landing-h2-1", TextProps);
  var landingText5 = new SplitText(".landing-h2-2", TextProps);

  const loops = [
    LoopText(landingText2, landingText3),
    LoopText(landingText4, landingText5),
  ];

  // The loops repeat forever; only run them while the landing section is on screen
  const landing = document.querySelector(".landing-section");
  if (prefersReducedMotion) {
    // Hold the first word of each pair; the swap loop never runs
    loops.forEach((tl) => tl.pause(0));
  } else if (landing) {
    new IntersectionObserver(([entry]) => {
      loops.forEach((tl) => tl.paused(!entry.isIntersecting));
    }).observe(landing);
  }
}

function LoopText(Text1: SplitText, Text2: SplitText) {
  var tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
  const delay = 4;
  const delay2 = delay * 2 + 1;

  tl.fromTo(
    Text2.chars,
    { opacity: 0, y: 80 },
    {
      opacity: 1,
      duration: 1.2,
      ease: "power3.inOut",
      y: 0,
      stagger: 0.1,
      delay: delay,
    },
    0
  )
    .fromTo(
      Text1.chars,
      { y: 80 },
      {
        duration: 1.2,
        ease: "power3.inOut",
        y: 0,
        stagger: 0.1,
        delay: delay2,
      },
      1
    )
    .fromTo(
      Text1.chars,
      { y: 0 },
      {
        y: -80,
        duration: 1.2,
        ease: "power3.inOut",
        stagger: 0.1,
        delay: delay,
      },
      0
    )
    .to(
      Text2.chars,
      {
        y: -80,
        duration: 1.2,
        ease: "power3.inOut",
        stagger: 0.1,
        delay: delay2,
      },
      1
    );
  return tl;
}
