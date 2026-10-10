// Touch-first devices (phones, tablets): the canvases render at a lower pixel
// ratio there, and height-only resizes from the browser toolbar are ignored
export const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
