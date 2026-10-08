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
- [ ] Scene: render on demand after the intro (deferred)

## Phase 2: Main thread (P1)
- [ ] Fix the stale `character` in resize (#5), remove the useless state
- [ ] Single debounced resize path, remove the splitText refresh-loop (#6)
- [x] Delete the TechStack scroll/click/interval handlers (#7)
- [ ] Idle-stop the Cursor + SocialIcons rAF; SocialIcons → transform (#8)
- [ ] Pause the flicker interval/timeline when off-screen

## Phase 3: Feel + CSS
- [ ] ScrollSmoother `smooth` ~0.9, `speed` 1, `effects:false`, kill on cleanup
- [ ] Cursor: drop `mix-blend-mode` (or test its cost first), career-dot shadow animation → opacity

## Phase 4: Load (P2)
- [ ] Clone materials before `compileAsync`
- [ ] Stop blocking on the image preload; `loading="lazy"`
- [ ] Draco wasm-only, share the HDR, throttle the loading-progress updates
- [ ] Vite manualChunks (rapier / postprocessing split)

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
