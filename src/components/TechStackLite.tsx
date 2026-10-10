import { useEffect, useRef, useState } from "react";
import "./styles/TechStackLite.css";

// Phones get the techstack as CSS "balls": the same logo textures and glossy
// white look as the 3D version, with no WebGL, physics or extra JS chunks
const LOGOS = [
  ["react2", "React"],
  ["typescript", "TypeScript"],
  ["node2", "Node.js"],
  ["javascript", "JavaScript"],
  ["next2", "Next.js"],
  ["mongo", "MongoDB"],
  ["express", "Express"],
  ["mysql", "MySQL"],
];

// Cluster: [logo index, size in px, vertical nudge in px]; repeats like the 3D pile
const BALLS: Array<[number, number, number]> = [
  [5, 78, 18], [0, 104, 0], [7, 86, 22],
  [3, 92, -6], [1, 110, 4], [4, 84, -10], [6, 74, 12],
  [2, 96, -14], [0, 80, 6], [3, 88, -4],
];

const TechStackLite = () => {
  const ref = useRef<HTMLUListElement>(null);
  const [inView, setInView] = useState(false);
  // Logos load once the section nears the viewport, not with the first page load
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -15% 0px" }
    );
    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        nearObserver.disconnect();
      },
      { rootMargin: "100% 0px" }
    );
    observer.observe(el);
    nearObserver.observe(el);
    return () => {
      observer.disconnect();
      nearObserver.disconnect();
    };
  }, []);

  return (
    <section className="techstack-lite" aria-labelledby="techstack-lite-title">
      <h2 id="techstack-lite-title">My Techstack</h2>
      <ul className={`techstack-lite-pile ${inView ? "techstack-lite-in" : ""}`} ref={ref}>
        {BALLS.map(([logo, size, nudge], i) => (
          <li
            key={i}
            className="techstack-lite-ball"
            style={
              {
                "--size": `${size}px`,
                "--nudge": `${nudge}px`,
                "--i": i,
                backgroundImage: near ? `url(/images/${LOGOS[logo][0]}.webp)` : undefined,
              } as React.CSSProperties
            }
          >
            <span className="sr-only">{LOGOS[logo][1]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default TechStackLite;
