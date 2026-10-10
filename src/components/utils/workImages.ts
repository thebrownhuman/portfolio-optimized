// The Work screenshots ship at 900w and 1600w: the slides are at most ~812 CSS px
// wide (2x screens pick 1600w), so the 2816px originals were ~4x the bytes needed.
// The img sizes itself from its intrinsic width (width: auto, then max-width and
// max-height clamp it), so "sizes" must never be below the rendered width
export const WORK_IMAGE_SIZES = "(max-width: 1024px) 94vw, 820px";
// Intrinsic size of the 1600w files, so the browser reserves the slide's height
export const WORK_IMAGE_WIDTH = 1600;
export const WORK_IMAGE_HEIGHT = 873;

export const workImageSrc = (name: string) => `/images/${name}-1600.webp`;
export const workImageSrcSet = (name: string) =>
  `/images/${name}-900.webp 900w, /images/${name}-1600.webp 1600w`;

export const WORK_IMAGES = ["Solidx", "radix", "bond", "sapphire", "Maxlife"];
