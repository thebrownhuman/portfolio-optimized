# Round 3 handoff (worker1), 2026-10-09 — VERIFIED

## Git
- Branch perf/optimize. Round 3 commits: 031d8fa (pushed), 6314f07, 01ce3e0, 3ad0d62, adf3aad, 61537e1, then "docs: round 3 verified" (local)
- Worker2 is editing nginx.conf/Dockerfile/security-headers.conf in parallel; worker1 did not touch them
- No servers running, no stashes, no extra worktrees. Untracked: tasks/shots/ only

## Round 3 status: all 5 done + verified
1. DRACOLoader removed (031d8fa)
2. character.glb 2.34MB -> 845KB, meshopt + webp q85 (6314f07). User decided: keep 845KB
3. Shared HDR (01ce3e0): 1 fetch/parse instead of 2; load long-task total (4x CPU) 2178 -> 1846ms
4. Self-hosted Geist + metric fallback (3ad0d62)
5. nginx cache/gzip (adf3aad); nginx -t OK; security headers now Worker2's job

## Verification (HEAD 61537e1 vs ref 6d40283)
- 63 shots at 1920x1080 / 1440x900 / 1146x815 / 390x844 (intro end, 11 scrolls, interactions, resize)
- Diffs >0.5% all explained: #01 loader marquee/counter timing (2.3-2.6%), blink/typing phase (<=0.8%),
  navbar scramble timing, TechStack physics #12/#13 (8-12%, same as r2 noise)
- Text: identical line breaks, antialias-only diffs. TechStack ball lighting matches side by side (side-12.png)
- Resize cycle back to top OK, idle animations move, 0 console errors, CLS 0.000 (1440) / 0.000 (390)
- Timing at 20Mbps/40ms: GLB done 3.03 -> 2.06s, loader 100% 3.40 -> 2.72s

## Gotchas
- Bench scripts: session scratchpad .../ca92b9d9-683e-4e75-8bdf-34ca9c8fa613/scratchpad/bench
  (verify-r3, diff-r3, resize-cycle-r3, idle, cls, loadtime, hdr, compress, texdiff)
- Shots: tasks/shots/verify-r3, idle-r3
- One vite dev server at a time (.vite cache 504s). character.glb is Git LFS
- gltf-transform CLI webp/resize fails (sharp colourspace); use bench/compress.mjs

## Open questions
- None from worker1
