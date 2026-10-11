import "./styles/About.css";

const About = () => {
  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <h2 className="title">About Me</h2>
        <p className="para">
          Software Engineer at GE HealthCare with a passion for building
          tools that automate and streamline complex processes. Skilled in
          Python, JavaScript, Java, and React, with experience spanning
          network automation, RPA development, and full-stack web applications.
          Certified in AWS, with a knack for UI design and a continuous
          drive to explore new technologies.
        </p>
        {/* Plain-sentence bio, also in index.html's static fallback for crawlers */}
        <p className="about-bio">
          Shivansh Mishra is a software engineer at GE HealthCare in Bangalore, India, building automation tools and web applications with Python, JavaScript, Java and React.
        </p>
      </div>
    </div>
  );
};

export default About;
