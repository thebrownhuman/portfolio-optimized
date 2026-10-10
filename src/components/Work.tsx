import { useState, useCallback } from "react";
import "./styles/Work.css";
import WorkImage from "./WorkImage";
import { MdArrowBack, MdArrowForward } from "react-icons/md";

const projects = [
  {
    title: "Solid Starters",
    category: "Low-Code Platform",
    tools: "Angular, Next.js, NestJS, MongoDB",
    image: "Solidx",
  },
  {
    title: "Radix",
    category: "E-Commerce",
    tools: "Angular, Next.js, NestJS, CMS",
    image: "radix",
  },
  {
    title: "Bond Cancellation",
    category: "Import-Export Automation",
    tools: "Angular, Next.js, NestJS, Workflows",
    image: "bond",
  },
  {
    title: "Sapphire",
    category: "CRM Platform",
    tools: "AngularJS, NestJS, PostgreSQL",
    image: "sapphire",
  },
  {
    title: "Mpro",
    category: "Insurance Platform",
    tools: "React.js, Node.js, Microservices",
    image: "Maxlife",
  },
];

const Work = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goToSlide = useCallback(
    (index: number) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setCurrentIndex(index);
      setTimeout(() => setIsAnimating(false), 500);
    },
    [isAnimating]
  );

  const goToPrev = useCallback(() => {
    const newIndex =
      currentIndex === 0 ? projects.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  }, [currentIndex, goToSlide]);

  const goToNext = useCallback(() => {
    const newIndex =
      currentIndex === projects.length - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  }, [currentIndex, goToSlide]);

  return (
    <div className="work-section" id="work">
      <div className="work-container section-container">
        <h2>
          My <span>Work</span>
        </h2>

        <div className="carousel-wrapper" role="region" aria-roledescription="carousel" aria-label="Projects">
          {/* Navigation Arrows */}
          <button
            className="carousel-arrow carousel-arrow-left"
            onClick={goToPrev}
            aria-label="Previous project"
            data-cursor="disable"
          >
            <MdArrowBack />
          </button>
          <button
            className="carousel-arrow carousel-arrow-right"
            onClick={goToNext}
            aria-label="Next project"
            data-cursor="disable"
          >
            <MdArrowForward />
          </button>

          {/* Slides */}
          <div className="carousel-track-container">
            <div
              className="carousel-track"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`,
              }}
            >
              {projects.map((project, index) => (
                <div
                  className="carousel-slide"
                  key={index}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${projects.length}`}
                  aria-hidden={index !== currentIndex}
                  // Off-screen slides leave the tab order (React 18 has no typed inert prop)
                  {...(index !== currentIndex ? { inert: "" } : {})}
                >
                  <div className="carousel-content">
                    <div className="carousel-info">
                      <div className="carousel-number">
                        <h3>0{index + 1}</h3>
                      </div>
                      <div className="carousel-details">
                        <h4>{project.title}</h4>
                        <p className="carousel-category">
                          {project.category}
                        </p>
                        <div className="carousel-tools">
                          <span className="tools-label">Tools & Features</span>
                          <p>{project.tools}</p>
                        </div>
                      </div>
                    </div>
                    <div className="carousel-image-wrapper">
                      <WorkImage image={project.image} alt={project.title} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="sr-only" aria-live="polite" aria-atomic="true">
            Project {currentIndex + 1} of {projects.length}: {projects[currentIndex].title}
          </p>

          {/* Dot Indicators */}
          <div className="carousel-dots">
            {projects.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentIndex ? "carousel-dot-active" : ""
                  }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to project ${index + 1}`}
                aria-current={index === currentIndex ? "true" : undefined}
                data-cursor="disable"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Work;
