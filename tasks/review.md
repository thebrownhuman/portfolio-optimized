# Portfolio Code Review: Performance and Correctness

Date: 2026-10-08. Scope: the entire `src/`, plus `index.html`, `nginx.conf`, `Dockerfile` and `public/`.
Method: static read of all the code. No profiler trace has been taken yet; the trace is the first step of the plan.

## TL;DR: why it feels laggy

There are three independent causes, and they stack:

1. **Too much GPU work.** Two WebGL contexts render at 60fps all the time. The TechStack canvas (N8AO ambient occlusion,
   shadows, physics, 30 MeshPhysicalMaterial spheres) renders even when nobody can see it.
2. **Main-thread layout thrash.** `getBoundingClientRect()` runs inside rAF loops and scroll handlers while GSAP
   rewrites transforms. Also, 4 rAF loops run forever, and the social icons animate `left`/`top`, which triggers layout.
3. **Lag that's built into the design.** ScrollSmoother uses `smooth: 1.7` and `speed: 1.7`, so the page takes about 1.7s to catch up with the
   scroll wheel. Even at a perfect 60fps this *feels* laggy, because input latency is the deliberate effect here.

The compositor makes all of this worse: a full-screen `mix-blend-mode: difference` cursor sits above both canvases, so every frame
forces the browser to re-blend the whole screen.

---

## P0: Critical (main lag)

### 1. The TechStack canvas never stops rendering
`src/components/TechStack.tsx:749`
- `<Canvas>` uses the default `frameloop="always"`, so it runs at 60fps from page load, even though it's far below the fold.
- `isActive` only skips applying the impulse in `useFrame`. Render, N8AO post-processing, the shadow pass and the Rapier
  physics step all keep running.
- Cost per frame: a full-screen SSAO pass + a shadow map + 30 clearcoat physical spheres (28×28 segments) + 31 rigid
  bodies with 61 colliders.
- It loads a second copy of `char_enviorment.hdr` and runs PMREM in a separate GL context.
- **Fix:** mount the component only when it's near the viewport (IntersectionObserver). Use `frameloop={visible ? "always" : "never"}`
  and `<Physics paused={!visible}>`, and set `dpr={[1, 1.5]}`. Remove `shadows`/`castShadow`/`receiveShadow`, because N8AO already shades the spheres.
  Switch to `MeshStandardMaterial` and 16–20 segments.

### 2. The character canvas forces a layout every frame
`src/components/Character/Scene.tsx:139`
- `currentDiv.getBoundingClientRect()` runs inside `animate()` every frame, while GSAP scrub changes transforms on
  `.character-model`. The result is a forced synchronous layout on every frame.
- **Fix:** have an IntersectionObserver set a `visible` flag, and have the loop read that flag.

### 3. The character renderer is heavier than it needs to be
`src/components/Character/Scene.tsx:33-38`
- `antialias: true` combined with `pixelRatio` up to 2 means 4× the pixels on HiDPI screens and 4K monitors.
- Every frame is rendered even when nothing changes.
- **Fix:** cap the DPR at 1.5. Once the intro has finished, render on demand only: when the mouse moved, the head lerp hasn't
  settled, a mixer action is running, the scroll position changed, or the flicker is active.

### 4. ScrollSmoother latency
`src/components/Navbar.tsx:933`
- `smooth: 1.7`, `speed: 1.7`, `effects: true`. A scroll feels like it lands 1.7s late, and `effects` adds per-frame work
  for every `data-speed` / `data-lag` element.
- **Fix:** `smooth: 0.8–1.0` and `speed: 1`. Set `effects: false` unless data-speed/lag are used (grep found no usage), and
  use `smoothTouch: false`.

---

## P1: High

### 5. Bug: resize destroys the character scroll timelines
`src/components/Character/Scene.tsx:87`
- `onResize` captures the `character` **React state variable** at the time the effect first runs. That value is `null`, and it never changes because
  the effect deps are `[]`.
- `handleResize(..., character!)` calls `setCharTimeline(null, camera)`, so the `if (character)` branch is skipped. All
  ScrollTriggers have already been killed, so after **any** window resize the character's scroll animations are gone.
- The `useState` for `character` is useless, and it causes an extra re-render.
- **Fix:** keep `gltf.scene` in a local `let`/ref and pass it in, then delete the state.

### 6. The resize path triggers a cascade
- `resizeUtils.ts` kills all triggers and rebuilds the timelines.
- `Navbar` calls `ScrollSmoother.refresh(true)` on every resize event, with no debounce.
- `MainContainer` calls `setSplitText()` on every resize event, with no debounce. Its effect depends on `[isDesktopView]`,
  so it re-subscribes and re-runs `setSplitText()` whenever the breakpoint flips.
- `splitText.ts:732` adds a `ScrollTrigger` "refresh" listener that calls `setSplitText()` again, which reverts and rebuilds
  every SplitText (DOM churn) and creates new ScrollTriggers. Those new triggers cause another refresh.
- **Fix:** debounce the resize in one place, run one `ScrollTrigger.refresh()`, and build the split text once using `gsap.matchMedia()`
  for the breakpoints instead of rebuilding by hand.

### 7. The TechStack scroll and click handlers
`src/components/TechStack.tsx:697-722`
- `getBoundingClientRect()` runs on every scroll event, which forces a layout.
- The threshold logic is wrong: it compares `scrollY` (a document offset) with `rect.top` (a viewport offset).
- A nav click starts `setInterval(10ms)` for 1s, which is 100 forced layouts plus `setState` calls.
- **Fix:** delete all of this and use an IntersectionObserver on the section.

### 8. Forever-running rAF and timer loops
| Where | What | Fix |
|---|---|---|
| `Cursor.tsx:996` | rAF every frame, even while the mouse is idle | stop once the cursor converges; restart on mousemove |
| `SocialIcons.tsx:1140` | rAF writes CSS vars that drive **`left`/`top`** → layout every frame, forever | use `transform: translate()`, idle-stop |
| `SocialIcons.tsx:1121` | `getBoundingClientRect` ×4 on every document mousemove | cache the rects; refresh on resize/scroll |
| `GsapScroll.ts:802` | `setInterval(200ms)` + an infinite flicker timeline, even when the monitor is off-screen | pause unless the What-I-Do section is visible |
| `initialFX.ts:597` | 2 infinite text-loop timelines | fine (cheap), but pause them when the landing section is off-screen |

### 9. Compositor and paint cost in the CSS
- `Cursor.css:13` `mix-blend-mode: difference` on a fixed element over the WebGL canvases forces a full-layer
  blend on every frame. The `box-shadow` glow on it adds paint. **Biggest CSS cost.** Consider dropping the blend
  mode, or using a solid cursor with `will-change: transform`.
- `Career.css:112` animates a `box-shadow` with a 110px blur `infinite` (a repaint every frame while on screen).
- `Landing.css:26/64` rotates fixed 300px radial gradients forever (cheap if composited; add `will-change: transform`).
- `Work.css:138` `backdrop-filter: blur(8px)` is fine if the element is small; check it in the trace.

---

## P2: Medium

10. **Shaders compile twice.** `character.ts:337` calls `compileAsync()`, then clones the shirt and pant materials, so they compile again
    on first render and cause a hitch at the start of the intro. Clone first, then compile.
11. **Image preload blocks loading.** `Scene.tsx:58` waits for 5 project screenshots (~970KB) before the intro.
    Use `loading="lazy"` on the `<img>` tags instead and stop blocking.
12. **The duplicated HDR (296KB)** is loaded by both canvases. Share one texture, or use a small drei preset/cubemap for TechStack.
13. **`setProgress().loaded()`** runs a `setInterval(2ms)` that calls `setLoading`, so React re-renders the Loading screen up to
    ~500 times/sec. Use a single GSAP tween or rAF and throttle the state updates.
14. **ScrollSmoother is created twice in dev** (StrictMode double-mount), and `smoother.kill()` is never called in the cleanup.
    The Scene also double-mounts, which creates two WebGL contexts and loads the GLB twice in dev. Dev only, but it makes local testing misleading.
15. **`Draco decoder` uses the JS build (720KB) + wasm (286KB) in `/public/draco`.** Only the wasm is needed. Set
    `dracoLoader.setDecoderConfig({ type: "wasm" })` and drop the JS file from the image.
16. **The resize debounce isn't applied in `Navbar`/`MainContainer`** (see #6).

## P3: Low / hygiene

17. `any` types throughout `GsapScroll.ts`, `lighting.ts` and `character.ts`. Use `THREE.Mesh<…, MeshStandardMaterial>`.
18. Non-null assertions that will crash if the model changes: `getObjectByName("footR")!`, `neckBone!`, `monitor.material`, `introClip!`.
19. `@types/three` is in `dependencies` and should be in devDependencies. `tsconfig.*.tsbuildinfo` is committed and should be gitignored.
20. `index.html` uses `.webp` as the favicon with `type="image/png"`, which is the wrong MIME type. The Google Fonts stylesheet blocks rendering;
    add `media="print" onload` or self-host it.
21. `nginx.conf`: no `/draco/` cache rule. Gzip doesn't list `model/gltf-binary` / `.hdr`. No brotli.
22. `vite.config.ts`: no manualChunks. three + drei + postprocessing + rapier all land in one lazy chunk; split rapier and
    postprocessing so the character loads faster.
23. No tests and no perf budget. Add a Lighthouse CI or a simple `performance.measure` check later.

---

## Expected impact
| Fix | Est. gain |
|---|---|
| TechStack: pause when off-screen + drop shadows/physical material | largest; removes a whole second GPU pipeline for most of the page |
| ScrollSmoother 1.7 → ~0.9 | biggest *perceived* gain |
| Remove per-frame `getBoundingClientRect` | removes forced layouts (main-thread jank) |
| Cursor blend mode + SocialIcons left/top | removes compositor + layout cost every frame |
| DPR cap 1.5 | ~40% fewer pixels on HiDPI |
