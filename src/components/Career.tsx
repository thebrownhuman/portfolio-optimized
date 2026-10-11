import "./styles/Career.css";

const Career = () => {
  return (
    <div className="career-section section-container">
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline">
            <div className="career-dot"></div>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h3>ARPA Intern</h3>
                <div className="career-company">HighRadius</div>
              </div>
              <div className="career-year">2022</div>
            </div>
            <p>
              Implemented Java-based automation agents for portal logins,
              receipt downloading, and business process optimization.
              Built a B2B Invoice Management Web App using React and Express.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h3>Software Engineer Intern</h3>
                <div className="career-company">GE HealthCare</div>
              </div>
              <div className="career-year">2022</div>
            </div>
            <p>
              Developed a Python-based Network Health Check tool, automating
              collection of network configuration backups, equipment status,
              and health information. Implemented FMEA to improve reliability.
            </p>
          </div>
          <div className="career-info-box">
            <div className="career-info-in">
              <div className="career-role">
                <h3>Software Engineer</h3>
                <div className="career-company">GE HealthCare</div>
              </div>
              <div className="career-year">NOW</div>
            </div>
            <p>
              Building and maintaining automation tools and software solutions
              for healthcare infrastructure. Working in a hybrid environment
              on network reliability and operational efficiency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Career;
