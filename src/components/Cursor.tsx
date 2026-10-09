import { useEffect, useRef } from "react";
import "./styles/Cursor.css";
import gsap from "gsap";
import { prefersReducedMotion } from "./utils/reducedMotion";

const Cursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let hover = false;
    const cursor = cursorRef.current!;
    const mousePos = { x: 0, y: 0 };
    const cursorPos = { x: 0, y: 0 };
    let rafId: number | undefined;

    // Runs only while the cursor is catching up to the mouse; restarted on mousemove
    const loop = () => {
      rafId = undefined;
      if (hover) return;
      // Reduced motion: jump straight to the pointer instead of easing after it
      const delay = prefersReducedMotion ? 1 : 6;
      const dx = mousePos.x - cursorPos.x;
      const dy = mousePos.y - cursorPos.y;
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        cursorPos.x = mousePos.x;
        cursorPos.y = mousePos.y;
      } else {
        cursorPos.x += dx / delay;
        cursorPos.y += dy / delay;
        rafId = requestAnimationFrame(loop);
      }
      cursor.style.transform = `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)`;
    };
    const startLoop = () => {
      if (rafId === undefined) rafId = requestAnimationFrame(loop);
    };

    const onMouseMove = (e: MouseEvent) => {
      mousePos.x = e.clientX;
      mousePos.y = e.clientY;
      startLoop();
    };
    document.addEventListener("mousemove", onMouseMove);

    const overHandlers: Array<{ el: HTMLElement; handler: (e: MouseEvent) => void }> = [];
    const outHandlers: Array<{ el: HTMLElement; handler: () => void }> = [];

    document.querySelectorAll("[data-cursor]").forEach((item) => {
      const element = item as HTMLElement;
      const overHandler = (e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        if (element.dataset.cursor === "icons") {
          cursor.classList.add("cursor-icons");
          gsap.to(cursor, { x: rect.left, y: rect.top, duration: 0.1 });
          cursor.style.setProperty("--cursorH", `${rect.height}px`);
          hover = true;
        }
        if (element.dataset.cursor === "disable") {
          cursor.classList.add("cursor-disable");
        }
      };
      const outHandler = () => {
        cursor.classList.remove("cursor-disable", "cursor-icons");
        hover = false;
        startLoop();
      };

      element.addEventListener("mouseover", overHandler);
      element.addEventListener("mouseout", outHandler);
      overHandlers.push({ el: element, handler: overHandler });
      outHandlers.push({ el: element, handler: outHandler });
    });

    return () => {
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMouseMove);
      overHandlers.forEach(({ el, handler }) => el.removeEventListener("mouseover", handler));
      outHandlers.forEach(({ el, handler }) => el.removeEventListener("mouseout", handler));
    };
  }, []);

  return <div className="cursor-main" ref={cursorRef}></div>;
};

export default Cursor;
