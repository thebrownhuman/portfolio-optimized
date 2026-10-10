import { SplitText } from "gsap/SplitText";
import gsap from "gsap";
import { setScrollPaused } from "../Navbar";
import { prefersReducedMotion } from "./reducedMotion";

// Reduced motion: the intro tweens jump to their end state
const t = (seconds: number) => (prefersReducedMotion ? 0 : seconds);

// ?fx=noblur: test switch for checking whether the per-character blur is what
// stutters the intro on a given device (paired with the ?debug frame readout)
const noBlur = new URLSearchParams(window.location.search).get("fx") === "noblur";
const blur = (px: number) => (noBlur ? "none" : `blur(${px}px)`);

// The intro text work (6 SplitText passes, ~60 char tweens, the word loops)
// took 50-70ms on a throttled phone, and on iOS ~200ms, all in the frame where
// the character starts rising. prepareInitialFX() does it ahead of time, while
// the loader still covers the page, with every tween paused; initialFX() at the
// reveal only flips classes and presses play.
let play: (() => void) | undefined;

export function prepareInitialFX() {
  if (play) return;
  // The landing must be mounted, or there is nothing to split yet
  if (!document.querySelector(".landing-intro h1")) return;
  const tweens: gsap.core.Animation[] = [];
  const add = <T extends gsap.core.Animation>(tween: T) => {
    tween.pause();
    tweens.push(tween);
    return tween;
  };
  add(gsap.to("body", {
    backgroundColor: "#0a0e17",
    duration: t(0.5),
    delay: t(1),
  }));

  var landingText = new SplitText(
    [".landing-info h3", ".landing-intro h2", ".landing-intro h1"],
    {
      type: "chars,lines",
      linesClass: "split-line",
    }
  );
  add(gsap.fromTo(
    landingText.chars,
    { opacity: 0, y: 80, filter: blur(5) },
    {
      opacity: 1,
      duration: t(1.2),
      filter: blur(0),
      ease: "power3.inOut",
      y: 0,
      stagger: t(0.025),
      delay: t(0.3),
    }
  ));

  // aria "hidden": the swapping words are labelled on their parent h2s in Landing.tsx
  // (SplitText's default aria-label on these plain divs is invalid ARIA)
  let TextProps = { type: "chars,lines", linesClass: "split-h2", aria: "hidden" as const };

  var landingText2 = new SplitText(".landing-h2-info", TextProps);
  add(gsap.fromTo(
    landingText2.chars,
    { opacity: 0, y: 80, filter: blur(5) },
    {
      opacity: 1,
      duration: t(1.2),
      filter: blur(0),
      ease: "power3.inOut",
      y: 0,
      stagger: t(0.025),
      delay: t(0.3),
    }
  ));

  add(gsap.fromTo(
    ".landing-info-h2",
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      duration: t(1.2),
      ease: "power1.inOut",
      y: 0,
      delay: t(0.8),
    }
  ));
  add(gsap.fromTo(
    [".header", ".icons-section", ".nav-fade"],
    { opacity: 0 },
    {
      opacity: 1,
      duration: t(1.2),
      ease: "power1.inOut",
      delay: t(0.1),
    }
  ));

  var landingText3 = new SplitText(".landing-h2-info-1", TextProps);
  var landingText4 = new SplitText(".landing-h2-1", TextProps);
  var landingText5 = new SplitText(".landing-h2-2", TextProps);

  const loops = [
    LoopText(landingText2, landingText3),
    LoopText(landingText4, landingText5),
  ];
  loops.forEach((tl) => tl.pause(0));

  play = () => {
    document.body.style.overflowY = "auto";
    setScrollPaused(false);
    document.getElementsByTagName("main")[0].classList.add("main-active");
    tweens.forEach((tween) => tween.play());
    // The loops repeat forever; only run them while the landing section is on screen.
    // Reduced motion holds the first word of each pair; the swap loop never runs
    const landing = document.querySelector(".landing-section");
    if (!prefersReducedMotion && landing) {
      new IntersectionObserver(([entry]) => {
        loops.forEach((tl) => tl.paused(!entry.isIntersecting));
      }).observe(landing);
    }
  };
}

// At the reveal: prepare now if it hasn't happened yet, then start everything
export function initialFX() {
  prepareInitialFX();
  if (play) {
    play();
    return;
  }
  // No landing to animate: still open the page
  document.body.style.overflowY = "auto";
  setScrollPaused(false);
  document.getElementsByTagName("main")[0]?.classList.add("main-active");
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
