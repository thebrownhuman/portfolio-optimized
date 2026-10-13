import { MdArrowOutward } from "react-icons/md";
import { imageSrcSet, pad, projects, toolList } from "./data";

const ProjectsIndex = () => (
  <>
    <section className="pj-hero section-container">
      <div className="pj-hero-in">
        <h1 className="pj-title">
          All <span>Projects</span>
        </h1>
        <p className="pj-lead">
          Low-code platforms, e-commerce, import-export automation, CRM and
          insurance. A closer look at each project from the Work section.
        </p>
      </div>
    </section>

    <ol className="pj-list section-container">
      {projects.map((p, i) => (
        // The first row's image is the page's LCP: it must not wait hidden for JS
        <li className="pj-item" key={p.slug} data-reveal={i === 0 ? "lcp" : ""}>
          <a className="pj-card" href={`/projects/${p.slug}`}>
            <div className="pj-media" data-cursor="disable">
              <img
                loading={i < 2 ? "eager" : "lazy"}
                decoding="async"
                src={`/images/${p.image}-1600.webp`}
                srcSet={imageSrcSet(p.image)}
                sizes="(max-width: 900px) 92vw, min(46vw, 660px)"
                width={1600}
                height={873}
                alt={p.title}
              />
            </div>
            <div className="pj-info">
              <span className="pj-num" aria-hidden="true">
                {pad(i + 1)}
              </span>
              <h2 className="pj-name">{p.title}</h2>
              <p className="pj-category">{p.category}</p>
              <ul className="pj-chips" aria-label="Tools">
                {toolList(p).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <span className="pj-cta">
                View project <MdArrowOutward aria-hidden="true" />
              </span>
            </div>
          </a>
        </li>
      ))}
    </ol>
  </>
);

export default ProjectsIndex;
