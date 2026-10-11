// Resolves once the page has loaded and painted and the main thread is idle,
// or at the visitor's first interaction, whichever comes first. The 3D
// character starts here, so it never competes with the first paint
export function afterIdle(timeout = 2000): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const inputs = ["pointerdown", "keydown", "touchstart", "wheel"];
    const finish = () => {
      if (done) return;
      done = true;
      inputs.forEach((t) => removeEventListener(t, finish));
      resolve();
    };
    inputs.forEach((t) => addEventListener(t, finish, { once: true, passive: true }));

    const whenLoaded = new Promise<void>((r) =>
      document.readyState === "complete" ? r() : addEventListener("load", () => r(), { once: true })
    );
    // Two frames: past the next paint
    const afterPaint = () =>
      new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    const idle = () =>
      new Promise<void>((r) =>
        window.requestIdleCallback
          ? window.requestIdleCallback(() => r(), { timeout })
          : setTimeout(r, 200)
      );
    whenLoaded.then(afterPaint).then(idle).then(finish);
  });
}
