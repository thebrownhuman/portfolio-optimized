// Resolved by the 3D scene once its model is loaded and lit. A returning visit
// (no loader) holds the reveal on it, so the character's intro starts as the
// page shows, as it does after the loader
let resolveReady: () => void = () => {};
export const characterReady = new Promise<void>((r) => (resolveReady = r));
export const markCharacterReady = () => resolveReady();
