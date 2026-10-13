import { MdArrowBack, MdArrowForward, MdArrowOutward } from "react-icons/md";
import { imageSrcSet, pad, Project, projects, toolList } from "./data";

const ProjectDetail = ({ project: p, index }: { project: Project; index: number }) => {
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];

  return (
    <>
      <section className="pj-hero pd-hero section-container">
        <div className="pj-hero-in">
          <a className="pd-back" href="/projects" data-cursor="disable">
            <MdArrowBack aria-hidden="true" /> All projects
          </a>
          <p className="pj-kicker">
            Project {pad(index + 1)} <span aria-hidden="true">/</span> {pad(projects.length)}
          </p>
          <h1 className="pj-title pd-title">{p.title}</h1>
          <p className="pd-category">{p.category}</p>
        </div>
      </section>

      {/* The hero image is the page's LCP: it must not wait hidden for JS */}
      <figure className="pd-shot section-container" data-reveal="lcp" data-cursor="disable">
        <img
          src={`/images/${p.image}-1600.webp`}
          srcSet={imageSrcSet(p.image)}
          sizes="(max-width: 900px) 100vw, 80vw"
          width={1600}
          height={873}
          alt={p.title}
          fetchPriority="high"
        />
      </figure>

      <section className="pd-body section-container" data-reveal>
        <div className="pd-block">
          <h2 className="pd-label">Tools &amp; Features</h2>
          <ul className="pj-chips pd-chips">
            {toolList(p).map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        {p.description && (
          <div className="pd-block pd-overview">
            <h2 className="pd-label">Overview</h2>
            <p className="pd-text">{p.description}</p>
          </div>
        )}
        {p.link && (
          <a
            className="pd-demo"
            href={p.link}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="disable"
          >
            Live demo <MdArrowOutward aria-hidden="true" />
          </a>
        )}
      </section>

      <nav className="pd-more section-container" aria-label="More projects" data-reveal>
        <a className="pd-more-link" href={`/projects/${prev.slug}`} data-cursor="disable">
          <span className="pd-more-dir">
            <MdArrowBack aria-hidden="true" /> Previous
          </span>
          <span className="pd-more-title">{prev.title}</span>
          <img
            className="pd-more-img"
            loading="lazy"
            decoding="async"
            src={`/images/${prev.image}-900.webp`}
            srcSet={imageSrcSet(prev.image)}
            sizes="(max-width: 900px) 100vw, 50vw"
            width={900}
            height={491}
            alt=""
          />
        </a>
        <a
          className="pd-more-link pd-more-next"
          href={`/projects/${next.slug}`}
          data-cursor="disable"
        >
          <span className="pd-more-dir">
            Next <MdArrowForward aria-hidden="true" />
          </span>
          <span className="pd-more-title">{next.title}</span>
          <img
            className="pd-more-img"
            loading="lazy"
            decoding="async"
            src={`/images/${next.image}-900.webp`}
            srcSet={imageSrcSet(next.image)}
            sizes="(max-width: 900px) 100vw, 50vw"
            width={900}
            height={491}
            alt=""
          />
        </a>
      </nav>
    </>
  );
};

export default ProjectDetail;
