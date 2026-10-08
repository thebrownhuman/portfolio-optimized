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

const SocialIcons = () => {
  useEffect(() => {
    const social = document.getElementById("social") as HTMLElement;
    const listeners: Array<{ target: EventTarget; event: string; handler: (e: any) => void }> = [];

    // Collect all icon state for a single shared RAF loop
    const icons: Array<{
      link: HTMLElement;
      mouseX: number;
      mouseY: number;
      currentX: number;
      currentY: number;
      elem: HTMLElement;
    }> = [];

    social.querySelectorAll("span").forEach((item) => {
      const elem = item as HTMLElement;
      const link = elem.querySelector("a") as HTMLElement;
      const initRect = elem.getBoundingClientRect();
      const state = {
        link,
        elem,
        mouseX: initRect.width / 2,
        mouseY: initRect.height / 2,
        currentX: 0,
        currentY: 0,
      };
      icons.push(state);

      const onMouseMove = (e: MouseEvent) => {
        const rect = elem.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x < 40 && x > 10 && y < 40 && y > 5) {
          state.mouseX = x;
          state.mouseY = y;
        } else {
          state.mouseX = rect.width / 2;
          state.mouseY = rect.height / 2;
        }
      };

      document.addEventListener("mousemove", onMouseMove);
      listeners.push({ target: document, event: "mousemove", handler: onMouseMove });
    });

    // Single RAF loop updates all icons
    let rafId: number;
    const updateAll = () => {
      icons.forEach((s) => {
        s.currentX += (s.mouseX - s.currentX) * 0.1;
        s.currentY += (s.mouseY - s.currentY) * 0.1;
        s.link.style.setProperty("--siLeft", `${s.currentX}px`);
        s.link.style.setProperty("--siTop", `${s.currentY}px`);
      });
      rafId = requestAnimationFrame(updateAll);
    };
    rafId = requestAnimationFrame(updateAll);

    return () => {
      cancelAnimationFrame(rafId);
      listeners.forEach(({ target, event, handler }) =>
        target.removeEventListener(event, handler)
      );
    };
  }, []);

  return (
    <div className="icons-section">
      <div className="social-icons" data-cursor="icons" id="social">
        <span>
          <a href="https://github.com/thebrownhuman" target="_blank" rel="noopener noreferrer">
            <FaGithub />
          </a>
        </span>
        <span>
          <a href="https://www.linkedin.com/in/thebrownhuman/" target="_blank" rel="noopener noreferrer">
            <FaLinkedinIn />
          </a>
        </span>
        <span>
          <a href="https://www.instagram.com/thebrownhuman/" target="_blank" rel="noopener noreferrer">
            <FaInstagram />
          </a>
        </span>
        <span>
          <a href="https://x.com/thebrownhuman" target="_blank" rel="noopener noreferrer">
            <FaXTwitter />
          </a>
        </span>
      </div>
      <a className="resume-button" href="#">
        <HoverLinks text="RESUME" />
        <span>
          <TbNotes />
        </span>
      </a>
    </div>
  );
};

export default SocialIcons;
