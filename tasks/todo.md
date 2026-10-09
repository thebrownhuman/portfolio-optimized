# Perf Optimization Plan

See `tasks/review.md` for the findings. Branch: `perf/optimize`. One commit per phase. Verify each phase in the browser (Performance trace + FPS).

## Phase 0: Baseline
- [x] `npm install`, `npm run build` passes
- [x] Record a baseline Performance trace (scroll through the whole page): FPS, long tasks, GPU time

## Phase 1: GPU (P0)
- [x] TechStack: mount only when near the viewport (IO), `frameloop` + `Physics paused` toggle, dpr cap
- [x] TechStack: remove shadows, use MeshStandardMaterial, 20 segments
- [x] Scene: IO visibility flag instead of per-frame `getBoundingClientRect`
- [x] Scene: DPR cap 1.5
- [x] Scene: render on demand (round 2, 30fps idle cap)

## Phase 2: Main thread (P1)
- [x] Fix the stale `character` in resize (#5), remove the useless state
- [x] Single debounced resize path, remove the splitText refresh-loop (#6)
- [x] Delete the TechStack scroll/click/interval handlers (#7)
- [x] Idle-stop the Cursor + SocialIcons rAF; SocialIcons → transform (#8)
- [x] Pause the flicker interval/timeline when off-screen

## Phase 3: Feel + CSS
- [x] ScrollSmoother `smooth` ~0.9, `speed` 1, `effects:false`, kill on cleanup
- [x] Cursor: tested `mix-blend-mode` cost (none measurable, kept); career-dot shadow animation → opacity on `::after`

## Phase 4: Load (P2)
- [x] Clone materials before `compileAsync` (no measurable gain: programs were already cached)
- [x] Stop blocking on the image preload; `loading="lazy"`
- [x] Draco wasm-only (model isn't Draco-compressed; decoder kept working for later), throttle the loading-progress updates
- [x] Share the HDR between the character and TechStack (01ce3e0)
- [x] Vite manualChunks (rapier / postprocessing split)
- [x] Character render on demand (Scene.tsx)
- [x] CLS: loader exit without layout animation

## Phase 5: Hygiene (P3)
- [ ] Types, non-null asserts, deps, gitignore tsbuildinfo, favicon, nginx draco cache

## Review
### Phase 0/1 (worker1, 2026-10-08)
Method: headless Chrome (RTX 4060, D3D11), 1440x900 @ DPR 2, **4x CPU throttle**, wait 11s for intro, 3s idle at top, then scroll whole page in 200 steps x 50ms. 3 runs each. Machine thermals drifted between runs, so baseline was re-run in the same window as the final numbers.

| | idle@top FPS | scroll FPS | scroll p95 frame | long tasks (count / total) |
|---|---|---|---|---|
| Baseline (first run) | 32-119 | 41-88 | 21-42ms | 5-14 / 0.5-1.5s |
| Baseline (re-run, same thermals as after) | 31-48 | 45-49 | 33-42ms | 12-19 / 1.1-1.7s |
| Phase 1 | 53-61 | 46-47 | 37ms | 7-11 / 0.63-0.72s |

Notes:
- Lazy-mounting the TechStack Canvas on IO moved ~1s of rapier wasm + shader compile + HDR/texture upload into mid-scroll (long tasks of 1s at the section entry). Reverted to eager mount + `frameloop="demand"` while off-screen + drei `<Preload all />` so compile/upload happens behind the loader.
- Remaining ~200ms spike at TechStack entry (scrollY~2345) = physics/frameloop resume.
- Unthrottled the GPU is never the limit on this machine (240fps cap headless); gains on weak GPUs are not measured here.

### Phase 2 (worker1)
Method changed: production builds (`vite build`) of HEAD vs working tree served side by side with `vite preview`, interleaved runs, same 4x CPU throttle. The dev-server A/B via git stash was unusable (HMR churn gave 8 fps on both).

| | scroll FPS | scroll p95 | long tasks (count / total) | scroll main-thread task time |
|---|---|---|---|---|
| Before (96964aa) | 40-41 | 46ms | 17-20 / 1.1-1.4s | 20.0-20.3s |
| After | 44-50 | 34-42ms | 4-16 / 0.4-1.0s | 18.4-19.8s |

Idle at the top and bottom of the page is saturated by WebGL in both builds (~2.97s of task time per 3s at 4x throttle). That is the character render loop at the top and TechStack (on-screen by design) at the bottom. Render-on-demand for the character is the remaining lever.

Extra findings fixed:
- The character IO never reported hidden: after tl3 the model sits at bottom = 0, and an edge-adjacent target still counts as `isIntersecting`. It now uses `intersectionRatio > 0`.
- `handleHeadRotation` read `window.scrollY`/`innerWidth` every frame (182ms self time in a 3s profile). It now uses cached values.
- The landing text loops (`initialFX`, repeat -1) ran forever. They now pause when the landing section is off-screen.
- SocialIcons rects are refreshed on resize only. The bar is `position: fixed`, so scroll never moves it.

Resize bug verified: on HEAD, after a resize the character stays at translateX -750px whatever the scroll position. After the fix it animates (-750 -> -1125 -> -930/-500 across scroll positions). No console errors.
TechStack entry spike (~150-200ms): resuming a viewport early (rootMargin 100%) moves it off-screen but does not remove it. The cost is physics/frameloop first frames.

### Phase 3 (worker1)
Same method (production builds, interleaved, 4x throttle), Phase 2 build vs Phase 3 build:

| | scroll FPS | scroll p95 | jank frames >50ms | long tasks (count / total) |
|---|---|---|---|---|
| Phase 2 | 45-49 | 37-42ms | 12-15 | 10 / 0.70-0.72s |
| Phase 3 | 48-55 | 33ms | 6-7 | 3-5 / 0.27-0.44s |

- ScrollSmoother: smooth 0.9, speed 1, effects false (no `data-speed`/`data-lag` in markup, so nothing visual is lost), smoothTouch false, `smoother.kill()` on cleanup.
- Cursor `mix-blend-mode: difference`: blend vs normal while moving the mouse and scrolling gave fps 47-55 vs 47-50 and task time 17.6-18.1s vs 18.1-18.2s. That is noise, so it was kept (measured on an RTX 4060; a weak iGPU may differ).
- Career dot: static small shadow on the dot, big glow on `::after`, pulse animates opacity. GSAP still tweens `animation-iteration-count` on the dot; `::after` inherits it (verified: computed `1` after the tween).
- Verified on the Phase 3 build: resize then scroll still animates the character; no console errors.

Cumulative from 96964aa (Phase 1) to Phase 3, scroll under 4x throttle: FPS 40-41 -> 48-55, long tasks 1.1-1.4s -> 0.27-0.44s.

### Round 2 (worker1, 2026-10-09): render on demand, Phase 4 load items, CLS
Commits: 3c432c7 (render on demand), 8e899e4 (materials before compile), 50281f0 (preload not blocking), ee1bbe7 (Draco wasm), 706febb (loader counter rAF), dd02da4 (manualChunks), 4f3d7fa (CLS).

Perf, production builds dfaccc2 vs 4f3d7fa, 1440x900 @ DPR 2, 4x CPU throttle, 3 interleaved runs. Headless rAF is uncapped (~220-240/s), so character renders/s is reported next to busy %.

| | before (dfaccc2) | after (4f3d7fa) |
|---|---|---|
| Idle at top, 10s: character renders/s | 216-220 | 30 |
| Idle at top: script time / 10s | 3.73-3.87s | 1.10-1.21s |
| Idle at top: main thread busy | 74-76% | 48-52% |
| Scroll pass: script time | 16.4s | 12.9-13.1s |
| Scroll pass: FPS / p95 frame | 149-153 / 12.5ms | 173-180 / 8.5ms |
| Loader reaches 100% | 4.12-4.22s | 3.64-3.67s |
| Page reveal (main-active) | 6.69-6.80s | 6.20-6.26s |
| CLS 1440x900 / 390x844 | 1.56 / 2.31 | 0.005 / 0.002 |

Idle-cap choice (same method): renders/s 60 / 30 / 20 gave script 1.65 / 1.10 / 0.91s per 10s. 30 keeps most of the win with smoother loops than 20. The remaining ~45% busy floor is shared (GSAP ticker, smoother, landing text loops, the bench's own rAF probe).

Chunks (kB, min): before index 152, three+stdlib 688, TechStack 2,479 (rapier + postprocessing + drei inlined). After: react 146, three 682, three-stdlib 84, rapier 2,082, postprocessing(+drei) 338, TechStack 27, helpers 1. The character never imported the TechStack chunk, so it was not blocked on rapier before either; the split gives parallel TechStack downloads and stable vendor caching (TechStack canvas ~60-80 ms earlier at 20 Mbps / 40 ms).

Notes:
- B1 (materials before compileAsync): 19 program links before and after; cloned materials already hit three's program cache.
- B3: character.glb is not Draco-compressed, so no decoder is fetched. public/draco had a .js + a .wasm matching no three release and no wasm wrapper; replaced with three's gltf wrapper + wasm (verified they instantiate) and dropped the 720 kB .js.
- B4: counter steps capped at 4/frame so a blocked frame can't jump 57 -> 100.
- CLS: ~165 shifts of .loading-wrap (min-width/min-height exit animation). Now a fixed-size layer revealed with clip-path keyframes sampled from the old curve. Frozen-frame diff of the exit vs before: <= 0.04% with the mouse over the pill; 0.5% / 2.5% (desktop/mobile) at 150 ms without a mouse (glow at its unset position).

Visual verification (dev servers, StrictMode, served code curl-checked), dfaccc2 vs 4f3d7fa, shots in tasks/shots/verify-r2 (not committed): 1920, 1440, 1146 and 390 mobile; loading, intro end, 11 scroll positions; 1440 interactions; resize 1440 -> 1100 -> 1440. Every pair <= 0.83% except the TechStack positions (8-16%, random ball layout per load). Double resize cycle: 7 ScrollTriggers throughout, rim at 220px, identical values per cycle. 10 s idle at top: blink still fires; desk scene (typing + flicker) changes every frame. No console errors.

### Round 3 (worker1, 2026-10-09)
- [x] 1 Drop DRACOLoader + public/draco (031d8fa, pushed). Model loads, intro/idle anims play, 0 console errors
- [x] 2 character.glb meshopt + webp q85: 2.34MB -> 845KB (6314f07). GLB done 3.03s -> 2.06s, loader 100% 3.40s -> 2.72s at 20Mbps/40ms (median of 3). Textures PSNR 40-53dB
- [x] 3 Shared HDR (01ce3e0): 1 fetch instead of 2; load long-task total (4x CPU) 2178 -> 1846ms
- [x] 4 Self-hosted Geist + fallback metrics (3ad0d62): CLS 0.002 (1440) / 0.000 (390)
- [x] 5 nginx fonts/wasm cache + gzip glb/hdr (adf3aad): nginx -t OK, no brotli on alpine
- [x] Full verify HEAD 61537e1 vs 6d40283 (63 shots, 1920/1440/1146/390): no regressions. >0.5% only loader marquee/counter timing (#01), blink/typing phase, navbar scramble timing, TechStack physics (#12/#13). Text: same line breaks, AA-only diffs. TechStack lighting matches by eye. Resize cycle OK, idle anims play, 0 console errors, CLS 0.000 (1440) / 0.000 (390)
