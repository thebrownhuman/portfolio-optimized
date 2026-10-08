# Round 3 handoff (worker1), 2026-10-09

## Git
- Branch perf/optimize. HEAD after this commit = "docs: round 3 handoff", on top of adf3aad
- origin/perf/optimize = 031d8fa (architect pushed it). Local only: 6314f07, 01ce3e0, 3ad0d62, adf3aad, handoff commit
- Tree clean apart from untracked tasks/shots/ (screenshots). No stashes, no extra worktrees
- No servers running (preview :5174 stopped)

## Round 3 status
1. Drop DRACOLoader (031d8fa): done + verified. Model loads, idle capture shows Blink/typing motion, 0 console errors
2. GLB compress (6314f07): done, verified by texture PSNR (40-53dB) + one pixel-diff run vs 6d40283.
   2.34MB -> 845KB. Load at 20Mbps/40ms, median of 3: GLB done 3.03s -> 2.06s, loader 100% 3.40s -> 2.72s.
   Diff: all shots <=0.5% except 1920x1080 #09 at 1.06% (r2 noise there was 0.54%; the red areas are face/hands/keys,
   i.e. typing animation phase) and TechStack #12/#13 (physics noise, same in r2). Names kept; quantize adds
   7 unnamed wrapper nodes under KEYS.*/Keyboard only
3. Shared HDR (01ce3e0): done, measured, NOT pixel-diffed yet (TechStack env now via <Environment map>)
4. Self-hosted Geist (3ad0d62): done, CLS checked, NOT pixel-diffed yet (fontsource file vs Google's may differ slightly)
5. nginx (adf3aad): done + verified with `nginx -t` in nginx:alpine. No brotli (no ngx_brotli)

## Next step to resume
- Run the full verify at HEAD vs 6d40283 (ref shots already captured):
  start preview "dev" (:5174), curl a served file to confirm HEAD code, then from the bench dir:
  `node verify-r3.mjs head 5174; node diff-r3.mjs; node resize-cycle-r3.mjs head 5174; node idle.mjs head 5174; node cls.mjs 5174 1440 900`
  Shots: tasks/shots/verify-r3, idle-r3. Watch for TechStack lighting (item 3) and text diffs (item 4)
- Then report the table to architect

## Gotchas
- Bench scripts: scratchpad/bench in the session temp dir
  (C:\Users\Shivansh\AppData\Local\Temp\claude\C--Users-Shivansh-Desktop-Projects-portfolio-optimized\ca92b9d9-...\scratchpad\bench):
  verify-r3/diff-r3/resize-cycle-r3/idle/cls/loadtime(dist dir, own static server)/hdr(dist dir)/geo/seq
- Prod builds for timing: `npx vite build --outDir <scratch>/dist-xxx`; dist-ref = 6d40283 (also holds the original GLB)
- character.glb is Git LFS: `git show HEAD:...glb` gives the pointer, not the file
- Only one vite dev server at a time (shared .vite cache -> 504 Outdated Optimize Dep)
- gltf-transform CLI `webp`/`resize` fail ("colourspace: parameter space not set"); use scratchpad/bench/compress.mjs
  (node compress.mjs in out 85 1024) with locally installed @gltf-transform 4.1.1 + sharp 0.33.5
- Scroll diffs #12/#13 are TechStack physics, nondeterministic; typing/blink phase gives ~0.5% on character shots
- nginx: location-level add_header drops the server-level security headers in /assets/, /models/, /fonts/ etc.
  (pre-existing nginx inheritance issue, not fixed)

## Open questions for the user
- Accept 1.06% diff on one character shot (texture recompress), or go to webp q90 (1.07MB, over the 1MB target)?
- Fix the nginx security-header inheritance (repeat add_header lines or use an include)?
