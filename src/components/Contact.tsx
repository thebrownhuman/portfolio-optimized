import { MdArrowOutward, MdCopyright } from "react-icons/md";
import "./styles/Contact.css";

const Contact = () => {
  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <h2>Contact</h2>
        <div className="contact-flex">
          <div className="contact-box">
            <h3>Email</h3>
            <p>
              <a href="mailto:thebrownhuman@gmail.com" data-cursor="disable">
                thebrownhuman@gmail.com
              </a>
            </p>
            <h3>Education</h3>
            <p>BTech in Computer Science</p>
          </div>
          <div className="contact-box">
            <h3>Social</h3>
            <a
              href="https://github.com/thebrownhuman"
              target="_blank" rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              Github <MdArrowOutward />
            </a>
            <a
              href="https://www.linkedin.com/in/thebrownhuman/"
              target="_blank" rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              Linkedin <MdArrowOutward />
            </a>
            <a
              href="https://www.instagram.com/thebrownhuman/"
              target="_blank" rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              Instagram <MdArrowOutward />
            </a>
            <a
              href="https://x.com/thebrownhuman"
              target="_blank" rel="noopener noreferrer"
              data-cursor="disable"
              className="contact-social"
            >
              Twitter <MdArrowOutward />
            </a>
          </div>
          <div className="contact-box">
            <div className="contact-credit">
              Designed and Developed <br /> by <span>Shivansh Mishra</span>
            </div>
            <div className="contact-year">
              <MdCopyright /> {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
