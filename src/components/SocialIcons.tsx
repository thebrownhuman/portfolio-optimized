import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import "./styles/SocialIcons.css";
import { TbNotes } from "react-icons/tb";
import { useEffect } from "react";
import HoverLinks from "./HoverLinks";
import { prefersReducedMotion } from "./utils/reducedMotion";

// No resume PDF yet: to bring the button back, add public/resume.pdf and set this to true
const SHOW_RESUME = false;

const SocialIcons = () => {
  useEffect(() => {
    // The icons drift toward the pointer; skip that entirely for reduced motion
    if (prefersReducedMotion) return;
    const social = document.getElementById("social") as HTMLElement;

    // Icon state for a single shared RAF loop; rects are cached (the bar is position: fixed, so only resize moves it)
    const icons: Array<{
      link: HTMLElement;
      elem: HTMLElement;
      rect: DOMRect;
      mouseX: number;
      mouseY: number;
      currentX: number;
      currentY: number;
    }> = [];

    social.querySelectorAll("span").forEach((item) => {
      const elem = item as HTMLElement;
      const rect = elem.getBoundingClientRect();
      icons.push({
        link: elem.querySelector("a") as HTMLElement,
        elem,
        rect,
        mouseX: rect.width / 2,
        mouseY: rect.height / 2,
        currentX: rect.width / 2,
        currentY: rect.height / 2,
      });
    });

    const refreshRects = () => {
      icons.forEach((s) => (s.rect = s.elem.getBoundingClientRect()));
    };

    // Runs only while an icon is moving; restarted on mousemove
    let rafId: number | undefined;
    const updateAll = () => {
      rafId = undefined;
      let moving = false;
      icons.forEach((s) => {
        const dx = s.mouseX - s.currentX;
        const dy = s.mouseY - s.currentY;
        if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
          s.currentX = s.mouseX;
          s.currentY = s.mouseY;
        } else {
          s.currentX += dx * 0.1;
          s.currentY += dy * 0.1;
          moving = true;
        }
        // Offset from the centered resting position
        const x = s.currentX - s.rect.width / 2;
        const y = s.currentY - s.rect.height / 2;
        s.link.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
      });
      if (moving) rafId = requestAnimationFrame(updateAll);
    };

    const onMouseMove = (e: MouseEvent) => {
      icons.forEach((s) => {
        const x = e.clientX - s.rect.left;
        const y = e.clientY - s.rect.top;
        if (x < 40 && x > 10 && y < 40 && y > 5) {
          s.mouseX = x;
          s.mouseY = y;
        } else {
          s.mouseX = s.rect.width / 2;
          s.mouseY = s.rect.height / 2;
        }
      });
      if (rafId === undefined) rafId = requestAnimationFrame(updateAll);
    };

    document.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", refreshRects);

    return () => {
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", refreshRects);
    };
  }, []);

  return (
    <div className="icons-section">
      <div className="social-icons" data-cursor="icons" id="social">
        <span>
          <a href="https://github.com/thebrownhuman" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <FaGithub />
          </a>
        </span>
        <span>
          <a href="https://www.linkedin.com/in/thebrownhuman/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <FaLinkedinIn />
          </a>
        </span>
        <span>
          <a href="https://www.instagram.com/thebrownhuman/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <FaInstagram />
          </a>
        </span>
        <span>
          <a href="https://x.com/thebrownhuman" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
            <FaXTwitter />
          </a>
        </span>
      </div>
      {SHOW_RESUME && (
        <a
          className="resume-button"
          href="/resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Resume (PDF, opens in new tab)"
        >
          <HoverLinks text="RESUME" />
          <span>
            <TbNotes />
          </span>
        </a>
      )}
    </div>
  );
};

export default SocialIcons;
