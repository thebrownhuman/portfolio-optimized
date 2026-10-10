import { MdArrowOutward } from "react-icons/md";
import {
  WORK_IMAGE_HEIGHT,
  WORK_IMAGE_SIZES,
  WORK_IMAGE_WIDTH,
  workImageSrc,
  workImageSrcSet,
} from "./utils/workImages";

interface Props {
  // Base name of a screenshot in /images, e.g. "bond" (see utils/workImages)
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
        <img
          src={workImageSrc(props.image)}
          srcSet={workImageSrcSet(props.image)}
          sizes={WORK_IMAGE_SIZES}
          width={WORK_IMAGE_WIDTH}
          height={WORK_IMAGE_HEIGHT}
          alt={props.alt ? `Screenshot of ${props.alt}` : ""}
          loading="lazy"
          decoding="async"
        />
      </Wrapper>
    </div>
  );
};

export default WorkImage;
