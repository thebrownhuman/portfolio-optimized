import { MdArrowOutward } from "react-icons/md";

interface Props {
  image: string;
  alt?: string;
  link?: string;
}

const WorkImage = (props: Props) => {
  const Wrapper = props.link ? 'a' : 'div';
  const wrapperProps = props.link
    ? { href: props.link, target: "_blank" as const, rel: "noopener noreferrer", "data-cursor": "disable" }
    : { "data-cursor": "disable" };

  return (
    <div className="work-image">
      <Wrapper className="work-image-in" {...wrapperProps}>
        {props.link && (
          <div className="work-link">
            <MdArrowOutward />
          </div>
        )}
        <img src={props.image} alt={props.alt} />
      </Wrapper>
    </div>
  );
};

export default WorkImage;
