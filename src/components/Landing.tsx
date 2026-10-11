import { PropsWithChildren } from "react";
import "./styles/Landing.css";

const Landing = ({ children }: PropsWithChildren) => {
  return (
    <>
      <div className="landing-section" id="landingDiv" tabIndex={-1}>
        <div className="landing-container">
          <div className="landing-intro">
            <h2>Hello! I'm</h2>
            <h1>
              SHIVANSH
              <br />
              <span>MISHRA</span>
            </h1>
          </div>
          <div className="landing-info">
            <div className="landing-kicker">
              {/* Screen readers get the sr-only copy; the visible one is split into chars */}
              <span className="sr-only">A Software</span>
              <span className="landing-kicker-text" aria-hidden="true">A Software</span>
            </div>
            <h2 className="landing-info-h2" aria-label="Developer">
              <div className="landing-h2-1">Developer</div>
              <div className="landing-h2-2">Engineer</div>
            </h2>
            <h2 aria-label="Engineer">
              <div className="landing-h2-info">Engineer</div>
              <div className="landing-h2-info-1">Developer</div>
            </h2>
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Landing;
