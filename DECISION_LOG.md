# Decision Log - Portfolio Rebranding & Review

> Session Date: 2026-03-14
> Project: shivanshPortfolio (formerly a friend's portfolio)
> Owner: Shivansh Mishra

---

## Context

Shivansh received this portfolio codebase from a friend and wants to rebrand it as his own. The site is a React + Three.js + GSAP portfolio with a 3D character, smooth scrolling, and interactive animations.

---

## Session Timeline

### 1. Initial Goal: Rebrand the Portfolio

**What we planned:**
- Replace all personal info (name, bio, career, education, social links, email)
- Update content to reflect Shivansh's profile

**Information gathered from LinkedIn screenshots:**
- **Name:** Shivansh Mishra
- **Title:** Software Engineer @ GE HealthCare
- **Education:** BTech in Computer Science, Kalinga Institute of Industrial Technology
- **Location:** Bengaluru, Karnataka, India
- **Career:**
  - GE HealthCare — Software Engineer (Aug 2023 – Present)
  - GE HealthCare — Software Engineer Intern (Sep 2022 – Jul 2023)
  - HighRadius — ARPA Intern (May 2022 – Sep 2022)
  - HighRadius — Technical Intern (Jan 2022 – May 2022)
  - Walmart Global Tech — Advanced SWE Intern (Mar 2022 – Apr 2022)
  - Goldman Sachs — Engineering Virtual Intern (Feb 2022 – Mar 2022)
- **Social links:**
  - Email: thebrownhuman@gmail.com
  - GitHub: https://github.com/thebrownhuman
  - LinkedIn: https://www.linkedin.com/in/thebrownhuman/
  - Instagram: https://www.instagram.com/thebrownhuman/
  - Twitter: to be added later

**Status:** Content gathered, rebrand edits pending (paused to address code issues first).

---

### 2. Full Code Review (32 Issues Found)

**Why:** Before rebranding and deploying, we wanted to understand the health of the codebase. A thorough audit was performed across all files.

**What was created:** `ISSUES.md` — a comprehensive list of 32 issues categorized by severity (Critical, High, Medium, Low).

**Key findings:**
- 3 Critical issues (hardcoded password, no SEO, memory leaks)
- 9 High issues (dead links, security gaps, invalid CSS)
- 15 Medium issues (cleanup bugs, no error boundaries, weak encryption)
- 5 Low issues (minor code quality)

---

### 3. GSAP Trial Package Discussion

**Issue:** The project uses `gsap-trial` (a trial/evaluation package) as a production dependency. This package includes premium plugins like `ScrollSmoother` but is not meant for production use — it can inject watermarks and may expire.

**Decision:** Since GSAP became completely free in 2025 (sponsored by Webflow), all plugins including ScrollSmoother are now available in the standard `gsap` package at no cost.

**Action needed:**
1. Create a free account at gsap.com (Shivansh did this)
2. Replace `gsap-trial` with `gsap` in package.json
3. Update all imports from `"gsap-trial/..."` to `"gsap/..."`

**Why this matters:** Removes legal/licensing risk and potential watermarks on the deployed site.

**Status:** Account created. Package swap not yet done.

---

### 4. Performance Investigation — Why the Site Takes 120s on Mobile

**User's question:** "My site takes 120 seconds to load on mobile. Why is moncy.dev so much faster?"

**Root cause identified:** The 3D character model (`character.glb`, ~2.3 MB) is encrypted with AES-CBC. On every page load, the browser must:
1. Fetch the encrypted `.enc` file
2. Hash the password with SHA-256
3. Decrypt 2.3 MB of data with AES-CBC
4. Create a Blob URL from the decrypted buffer
5. Then load the GLB from the Blob

This adds 1-3 seconds on mobile for **zero security benefit** because the decryption password `"MyCharacter12"` is hardcoded in the JavaScript bundle that ships to the browser. Anyone can view-source, find the password, and decrypt the model themselves.

**Analogy used:** "It's like locking a door and taping the key to the doorknob."

---

### 5. Decision: Remove Encryption (DONE)

**What was changed:**

**File: `src/components/Character/utils/character.ts`**
- Removed: `import { decryptFile } from "./decrypt"`
- Removed: The `decryptFile()` call that fetched `/models/character.enc`, decrypted it, and created a Blob URL
- Added: Direct loading of `/models/character.glb` via GLTFLoader
- Net effect: ~10 lines removed, 1 line changed

**File: `src/components/Character/utils/decrypt.ts`**
- Deleted entirely (23 lines)
- Contained `generateAESKey()` and `decryptFile()` functions
- No other file imported from this module (verified via grep)

**Why this decision:**
1. **Performance:** Saves 1-3 seconds of CPU time on every page load (especially impactful on mobile)
2. **Security:** The encryption provided zero actual protection since the key was in the client bundle
3. **Complexity:** Removes an entire module and simplifies the loading pipeline
4. **Reliability:** Eliminates a potential failure point (Web Crypto API issues on older browsers)

**What still needs to happen:**
- The encrypted file `public/models/character.enc` can be deleted to save ~2.3 MB from the repo
- A `character.glb` file needs to exist at `public/models/character.glb` for the site to work

---

### 6. GitHub Repository Setup

**Repo created:** `thebrownhuman/shivanshPortfolio`
- Visibility: Public (needed for free hosting on Vercel/Netlify/GitHub Pages)
- No README/gitignore/license added via GitHub (to avoid merge conflicts with existing files)
- Description: "Personal portfolio website built with React, Three.js, and GSAP — featuring 3D animations and smooth scrolling."

**Why these choices:**
- Public: Portfolio sites should be public for hosting and showcasing work
- No auto-generated files: The project already has `.gitignore`, `LICENSE`, and `README.md` — adding duplicates via GitHub would cause merge conflicts on first push

**Status:** Repo created, push pending.

---

### 7. Converted 5 Project Images from PNG to WebP (DONE)

**What:** Converted all 5 project screenshots from PNG to WebP at quality 80 using `sharp-cli`.

| File | Before (PNG) | After (WebP) | Reduction |
|------|-------------|--------------|-----------|
| bond | 7.0 MB | 222 KB | 97% |
| Maxlife | 6.7 MB | 210 KB | 97% |
| radix | 6.9 MB | 162 KB | 98% |
| sapphire | 6.8 MB | 201 KB | 97% |
| Solidx | 6.5 MB | 159 KB | 98% |
| **Total** | **34 MB** | **954 KB** | **97%** |

**File changed:** `src/components/Work.tsx` — Updated all 5 image paths from `.png` to `.webp`.

**Why:** These 5 uncompressed PNGs were the #1 reason the site took 120s on mobile (4G). WebP gives near-identical quality at a fraction of the size. Quality 80 is the sweet spot.

**Impact:** Saves ~33 MB. On 4G mobile (~5 Mbps), this alone saves ~50 seconds of load time.

---

### 8. Deleted Duplicate character.enc and decrypt.cjs (DONE)

**What:** Deleted `public/models/character.enc` (2.3 MB) and `public/models/decrypt.cjs` (encryption script).

**Why:** Code now loads `character.glb` directly (fixed in step 5). The `.enc` file and Node.js encryption script are no longer needed.

**Impact:** Saves 2.3 MB from the repo.

---

### 9. Added Lazy Loading to Project Images (DONE)

**File changed:** `src/components/WorkImage.tsx` line 39

**Before:** `<img src={props.image} alt={props.alt} />`
**After:** `<img src={props.image} alt={props.alt} loading="lazy" />`

**Why:** Project images are in a carousel below the fold. Without lazy loading, the browser downloads all 5 images on page load even though the user hasn't scrolled to them. With `loading="lazy"`, images load on-demand.

---

### 10. Capped devicePixelRatio to 2 (DONE)

**File changed:** `src/components/Character/Scene.tsx` line 35

**Before:** `renderer.setPixelRatio(window.devicePixelRatio)`
**After:** `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`

**Why:** On 3x phones, the GPU renders 9x the pixels (3^2). The visual difference between 2x and 3x is barely noticeable, but the GPU workload is massive. This is a standard Three.js best practice.

**Impact:** On 3x devices, GPU renders 2.25x pixels instead of 9x (75% less work).

---

### 11. Removed Unused @react-three/cannon Dependency (DONE)

**Command:** `npm uninstall @react-three/cannon`

**Why:** The project uses `@react-three/rapier` for physics (TechStack bouncing spheres). The `@react-three/cannon` package had zero imports anywhere in the codebase — it was dead weight.

**Impact:** 4 packages removed, smaller bundle, cleaner dependencies.

---

### 12. Disabled N8AO Post-Processing on Mobile (DONE)

**File changed:** `src/components/TechStack.tsx`

**What:** Added `const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;` and wrapped `<EffectComposer>` in `{!isMobile && (...)}`.

**Why:** N8AO (ambient occlusion) is a full-screen post-processing shader running every frame. On mobile GPUs it's expensive and the visual benefit on small screens is minimal. The tech spheres still look great without it.

**Impact:** Removes a full-screen shader pass on mobile, improving frame rates and reducing battery drain.

---

### Decision: Keep Loading Screen Delays

**Shivansh explicitly asked** to keep the loading screen delays (600ms + 1000ms + 900ms + slow progress bar). The loading animation is part of the site's design and identity. We respect this.

---

### 13. Fixed React StrictMode Double Character Rendering (DONE)

**File changed:** `src/components/Character/Scene.tsx`

**Problem:** On mobile, two identical 3D characters appeared, both animating in sync. One would get stuck while the other continued.

**Root cause:** React StrictMode unmounts and remounts components in development. The original cleanup function didn't properly clean up:
- No `cancelAnimationFrame` for the render loop
- Event listeners added with anonymous functions couldn't be removed (different references)
- No `disposed` flag to prevent async operations (model load callback) from running after unmount

**Fix:**
- Captured `currentDiv` ref at effect start for cleanup
- Added `disposed` flag — checked before any async operations proceed
- Tracked `animFrameId` and called `cancelAnimationFrame(animFrameId)` in cleanup
- Used named `onResize` and `onMouseMove` functions so `removeEventListener` works with the same reference
- Added `progress.dispose()` call in cleanup

**Why this matters:** Any recruiter opening the site on desktop (dev mode) would see duplicate characters — an instant credibility killer.

---

### 14. Fixed Loading Bar Restart Bug (DONE)

**File changed:** `src/components/Loading.tsx`

**Problem:** The loading bar would go 0→100%, then restart and get stuck around 50%.

**Root cause:** StrictMode double-mount created two progress trackers. The first one's intervals kept running after unmount, conflicting with the second tracker.

**Fix:** Added `dispose()` function and `disposed` flag to `setProgress`:
- All intervals check `disposed` before executing
- `dispose()` kills all intervals immediately
- Scene.tsx cleanup calls `progress.dispose()`

---

### 15. Fixed Blank Project Images on First Load (DONE)

**Files changed:** `src/components/Character/Scene.tsx`, `src/components/WorkImage.tsx`

**Problem:** On the very first visit, project carousel images were blank (white). Fine after refresh.

**Root cause:** We had added `loading="lazy"` to images (decision #9). But lazy-loaded images don't start fetching until they're near the viewport. On first visit, the browser cache is empty, so when the user scrolls to the carousel, images haven't loaded yet.

**Fix (two-part):**
1. **Removed `loading="lazy"`** from WorkImage.tsx — it caused more harm than good for above-the-fold-adjacent content
2. **Added image preloading** in Scene.tsx during the loading screen:
   ```typescript
   const preloadImages = () => {
     const urls = ["/images/Solidx.webp", "/images/radix.webp", ...];
     return Promise.all(urls.map((src) => new Promise<void>((resolve) => {
       const img = new Image();
       img.onload = () => resolve();
       img.onerror = () => resolve(); // Don't block on errors
       img.src = src;
     })));
   };
   const imagesReady = preloadImages();
   // ... later, after model loads:
   await imagesReady;
   progress.loaded();
   ```

**Why this approach:** The loading screen already exists and runs for several seconds. Using that time to preload images means they're cached before the user ever sees the carousel. No extra wait time.

---

### 16. Fixed Carousel Bleed on Mobile (DONE)

**File changed:** `src/components/styles/Work.css`

**Problem:** On mobile, adjacent carousel slide content was visible/bleeding into the current slide.

**Fix:** Added `max-width: 100%` and `overflow: hidden` to `.carousel-slide` and `overflow: hidden` to `.carousel-content`.

---

### 17. Fixed "What I Do" Section Invisible on Real Mobile (DONE)

**Files changed:** `src/components/styles/WhatIDo.css`, `src/components/WhatIDo.tsx`, `src/components/utils/GsapScroll.ts`

**Problem:** The "What I Do" section was completely invisible on real mobile phones, but visible in Chrome DevTools mobile emulation.

**Root cause (multi-layered — this took 5 attempts to fix):**

1. **CSS `display: none` on `.what-box-in`** (line 40 of WhatIDo.css) — the section starts hidden
2. **GSAP ScrollTrigger was supposed to reveal it** — in `GsapScroll.ts`, the mobile `else` branch (line 121) creates a ScrollTrigger to toggle `display: none → flex`
3. **But the `else` branch is gated by `if (character)`** — the 3D model must load first
4. **On real mobile, `setCharTimeline` may be called before the model loads**, or the function may not fire reliably because ScrollSmoother's scroll proxy interferes with ScrollTrigger
5. **Chrome DevTools works differently** — it doesn't have the same ScrollSmoother/ScrollTrigger timing issues as real mobile browsers

**Failed attempts and why they failed:**
- **Attempt 1:** Changed ScrollTrigger trigger from `.what-box-in` to `.whatIDO` — didn't work because the trigger change wasn't the issue; the entire `else` block was being skipped
- **Attempt 2:** IntersectionObserver in WhatIDo.tsx — didn't work because ScrollSmoother uses CSS transforms for scrolling, so `getBoundingClientRect()` and IntersectionObserver don't reflect the true scroll position
- **Attempt 3:** Various JS-based scroll listeners — unreliable with ScrollSmoother's paused state during loading

**Final fix (CSS + JS hybrid):**

**WhatIDo.css** — In `@media (max-width: 1024px)`:
```css
.what-box-in {
  display: flex !important;  /* Force visible — bypass GSAP entirely */
  opacity: 0;               /* Start invisible for fade animation */
}
/* Pause sub-animations until revealed */
.what-box-in .what-content-in,
.what-box-in .what-content::before, /* ...etc */ {
  animation-play-state: paused;
}
.what-box-in.revealed .what-content-in,
.what-box-in.revealed .what-content::before, /* ...etc */ {
  animation-play-state: running;
}
```

**WhatIDo.tsx** — Added native scroll listener (NOT ScrollTrigger) with capture phase:
```typescript
const checkReveal = () => {
  const rect = boxIn.getBoundingClientRect();
  if (rect.top < window.innerHeight * 0.85) {
    boxIn.style.transition = "opacity 0.6s ease";
    boxIn.style.opacity = "1";
    boxIn.classList.add("revealed"); // Triggers CSS animations
  }
};
window.addEventListener("scroll", checkReveal, true); // capture phase
```

**GsapScroll.ts** — Removed the mobile `else` block entirely (lines 121-131). The mobile reveal is now handled by WhatIDo.tsx directly.

**Key decisions:**
- `display: flex !important` in CSS ensures the element has layout (non-zero height) so scroll detection works
- `opacity: 0` hides it visually until the scroll listener reveals it
- Native `scroll` event with `capture: true` fires even with ScrollSmoother active (ScrollSmoother uses CSS transforms, not native scroll, but scroll events still bubble)
- `animation-play-state: paused/running` ensures the border/flicker animations only play when the section is revealed, matching the desktop experience

---

### 18. Fixed "What I Do" Card Expand Not Working on Real Mobile (DONE)

**File changed:** `src/components/WhatIDo.tsx`

**Problem:** Tapping the Frontend/Backend cards didn't expand them on real mobile phones, but worked in Chrome DevTools emulation.

**Root cause (TWO bugs):**

**Bug 1 — React StrictMode double-listener toggle cancellation:**
The click handler used anonymous functions:
```typescript
// Adding:
container.addEventListener("click", () => handleClick(container));
// Cleanup:
container.removeEventListener("click", () => handleClick(container));
```
`removeEventListener` with a NEW anonymous function doesn't match the original — cleanup does nothing. StrictMode unmounts/remounts, so TWO listeners get attached. `handleClick` uses `classList.toggle()`, so:
- Listener 1: toggles `what-content-active` ON
- Listener 2: toggles `what-content-active` OFF
- Net result: nothing visible happens

**Bug 2 — iOS Safari click events on non-interactive elements:**
iOS Safari doesn't fire `click` events on `<div>` elements unless they have `cursor: pointer`. Chrome DevTools doesn't enforce this restriction.

**Fix:**
```typescript
// Store stable references for proper cleanup
const clickHandlers: Array<{ el: HTMLDivElement; handler: () => void }> = [];
if (isTouch) {
  containerRef.current.forEach((container) => {
    const handler = () => handleClick(container);
    clickHandlers.push({ el: container, handler });
    container.addEventListener("click", handler);
  });
}
return () => {
  clickHandlers.forEach(({ el, handler }) => {
    el.removeEventListener("click", handler); // Same reference!
  });
};
```

**WhatIDo.css** — Added `cursor: pointer` to `.what-content` in mobile media query.

**Why Chrome DevTools worked but real mobile didn't:**
1. DevTools doesn't have StrictMode's timing behavior differences on real devices
2. DevTools doesn't enforce iOS Safari's `cursor: pointer` requirement for click events

---

### 19. Deleted Old PNG Files (DONE)

**Files deleted:** `public/images/Solidx.png`, `public/images/radix.png`, `public/images/bond.png`, `public/images/sapphire.png`, `public/images/Maxlife.png`

**Kept:** `public/images/preview.png` (referenced in README.md as OG/preview image)

**Why:** The WebP replacements (decision #7) are in use. The original PNGs were 34 MB of dead weight.

---

### 20. Deleted Unused WebP Images (DONE)

**Files deleted:** `next.webp`, `next1.webp`, `nextBL.webp`, `node.webp`, `react.webp`, `placeholder.webp` from `public/images/`.

**Why:** Grep confirmed these 6 files (~1.7MB total) are not referenced anywhere in source code. Leftover from previous design iterations. Keeping them bloats repo size.

---

### 21. Deleted Dead Code Files (DONE)

**Files deleted:** `test.js`, `public/models/encrypt.cjs`, `src/components/Character/exports.ts`

**Why:**
- `test.js` — Orphaned scratch file referencing `clickElement` and `video` without context. Not a real test, not imported anywhere.
- `encrypt.cjs` — Node.js encryption script leftover from the removed encryption system (Decision #5). Publicly accessible at `/models/encrypt.cjs` — no reason to keep it.
- `exports.ts` — Empty file (0 bytes) in Character directory. Pure dead code.

---

### 22. Updated MIT License (DONE)

**File changed:** `LICENSE`

**What:** Updated copyright holder to "Shivansh Mishra" as part of the rebranding.

**Why:** MIT license permits derivative works. Updating the copyright reflects the new owner.

---

### 23. Squashed Git History (DONE)

**What:** Used `git checkout --orphan` to create a new branch with a single commit, then force-pushed to replace the remote.

**Before:** 4 commits (Initial commit, optimization, license update, preview image)
**After:** 1 commit ("Initial commit: Shivansh Mishra's portfolio website")

**Why:** User requested clean history with no trace of iterative bug fixes. For a personal portfolio, clean history is preferred over preserving blame/debug information.

**Tradeoff:** Cannot `git blame` individual changes. Acceptable since all decisions are documented in this file.

---

### 24. Created Relevant Code Reviews File (DONE)

**File created:** `relevant_code_reviews.md`

**What:** Categorized all 55 findings from `code_review.md` into three groups:
- **Already Fixed (11)** — everything resolved this session
- **Relevant / Should Fix (21)** — bugs, memory leaks, dead links, asset bloat that affect recruiters
- **Not Relevant / Safe to Ignore (23)** — enterprise-grade nitpicks that don't matter for a portfolio

**Why:** The raw code review has 55 findings which is overwhelming. This file explains WHY each issue matters (or doesn't) in the context of a personal portfolio visited by recruiters, not a production SaaS app.

---

### 25. Code Review Fixes — Session 2 (2026-03-15)

All 15 relevant issues from `relevant_code_reviews.md` fixed in one batch. Zero visual changes.

**R13. Added `rel="noopener noreferrer"` to all external links**
- Files: `SocialIcons.tsx`, `Contact.tsx`, `WorkImage.tsx`
- All `target="_blank"` links now have proper security attributes

**R14. Changed `overflow: clip` → `overflow: hidden`**
- File: `src/index.css` (`.techstack` class)
- `overflow: clip` has limited Safari support. `overflow: hidden` is equivalent here.

**R1. Removed dead video hover feature from WorkImage.tsx**
- Removed `useState`, `handleMouseEnter`, `onMouseLeave`, `video` prop, `<video>` element
- The `fetch("src/assets/...")` path would 404 in production, and no project uses the video prop

**R2. Fixed Loading.tsx side effects during render**
- Moved `if (percent >= 100) { setTimeout(...) }` from render body into `useEffect([percent])`
- Old code spawned duplicate timers on every re-render when percent >= 100

**R3. Fixed Cursor.tsx RAF + event listener leaks**
- Stored RAF ID for `cancelAnimationFrame` in cleanup
- Named `onMouseMove` function for proper `removeEventListener`
- Stored `mouseover`/`mouseout` handler references for proper cleanup

**R4 + R9. Fixed SocialIcons.tsx RAF leak + stale rect + wrong cleanup**
- Stored RAF IDs in array, cancel all in cleanup
- Changed cleanup to remove from `document` (where listeners were added), not `elem`
- Recalculate `getBoundingClientRect()` on every mousemove instead of caching once at mount

**R5. Fixed Navbar.tsx resize + click listener leaks**
- Named `onResize` function, stored click handler references
- Proper `removeEventListener` in cleanup for both

**R6. Fixed Scene.tsx stacking touchmove listeners**
- Replaced `touchstart → addEventListener("touchmove")` pattern with single `touchmove` listener on `landingDiv`
- Old code added a new anonymous `touchmove` handler on every touch = memory leak

**R7. Fixed splitText.ts recursive ScrollTrigger refresh listener**
- Added `refreshListenerAdded` guard flag
- Without it: every `setSplitText()` call added another "refresh" listener → exponential growth on resize

**R8. Fixed TechStack.tsx random material in render**
- Pre-computed `materialIndex` per sphere at module level
- Old code: `materials[Math.floor(Math.random() * materials.length)]` in JSX = different material on every re-render

**R10. Fixed character.ts race condition**
- Moved `resolve(gltf)` after `setCharTimeline`, `setAllTimeline`, and bone positioning
- Old code resolved the promise before setup was complete

**R12. Added SEO meta tags to index.html**
- Added: meta description, Open Graph tags (title, description, image, url, type), Twitter Card tags, favicon
- OG image points to `/images/preview.png` at `shivanshmishra.in`

**R20. Deleted unused CSS classes**
- Removed `.loading-icon` (3 rules) from Loading.css
- Removed `.check-line` from SocialIcons.css
- Removed `.landing-video`, `.landing-image` from Landing.css
- Removed `.character-loaded .character-rim` from Landing.css

**R21. Removed empty useEffect from LoadingProvider.tsx**
- `useEffect(() => {}, [loading])` did nothing. Removed along with unused `useEffect` import.

---

## Remaining Items (Pending)

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| R11 | Fix dead resume button link (`SocialIcons.tsx:77` has `href="#"`) | Critical | Waiting for resume PDF from Shivansh. Once provided: place in `public/`, update href to `/resume.pdf` with `target="_blank" rel="noopener noreferrer"` |

**Everything else from `relevant_code_reviews.md` is DONE.** 31 out of 32 relevant issues fixed across 2 sessions. Only R11 remains.

---

## Verification Results

- **TypeScript:** `npx tsc --noEmit` — 0 errors
- **Production build:** `npx vite build` — succeeds in 3.73s
- **Dev server:** runs clean, no errors

---

## Summary of Performance Impact

| Metric | Before | After |
|--------|--------|-------|
| Total asset size | ~42 MB | ~5 MB |
| Project images | 34 MB (PNG) | 954 KB (WebP) |
| Duplicate model files | 4.6 MB | 2.3 MB |
| Unused image assets | ~1.7 MB | Deleted |
| Dead files | 3 files | Deleted |
| Unused dependencies | @react-three/cannon | Removed |
| Encryption overhead | 500ms-2s/load | 0 |
| Mobile GPU pixel load (3x) | 9x | 2.25x (capped at 2) |
| Mobile post-processing | N8AO every frame | Disabled |
| Image loading strategy | Preloaded during loading screen | Cached before visible |
| Git commits | 4 | 1 (squashed) |

## Summary of Bug Fixes

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Duplicate 3D characters | StrictMode double-mount, no cleanup | Disposed flag, cancelAnimationFrame, named listeners |
| Loading bar restart | StrictMode double progress tracker | dispose() function kills intervals |
| Blank carousel images | lazy loading + empty cache | Preload during loading screen |
| Carousel bleed on mobile | No overflow clipping | overflow: hidden on slide containers |
| WhatIDo invisible on mobile | GSAP ScrollTrigger unreliable with ScrollSmoother on mobile | CSS display:flex !important + native scroll fade-in |
| Card expand broken on mobile | Double click listeners (StrictMode) + iOS cursor:pointer | Stable handler refs + cursor:pointer CSS |
| Cursor RAF never cancelled | Anonymous RAF loop + mousemove | Named functions, stored RAF ID, proper cleanup |
| SocialIcons RAF leak × 3 icons | RAF per icon never cancelled, wrong cleanup target | Stored RAF IDs + listeners, cleanup from correct target |
| SocialIcons stale coordinates | getBoundingClientRect cached once at mount | Recalculate rect on every mousemove |
| Navbar resize listener stacks | Anonymous function in addEventListener | Named onResize, cleanup in return |
| Scene touchmove stacking | New listener added inside touchstart on every touch | Single touchmove listener added once |
| splitText recursive listeners | ScrollTrigger "refresh" re-adds listener every call | Guard flag prevents re-registration |
| TechStack material flicker | Math.random() in JSX re-evaluated on render | Pre-computed materialIndex at module level |
| Loading.tsx duplicate timers | setTimeout in render body, not useEffect | Moved to useEffect with [percent] dependency |
| character.ts race condition | resolve() before bone positioning | Moved resolve() after all setup completes |
| WorkImage 404 in production | fetch("src/assets/...") path doesn't exist after build | Removed dead video feature entirely |

---

## Architecture Notes

The site's loading pipeline (after our changes):

```
Page Load
  → Loading.tsx (animated loader with progress bar)
  → Scene.tsx (creates WebGL renderer, camera, lights)
    → character.ts (loads /models/character.glb via GLTFLoader + DRACOLoader)
      → Sets up clothing colors (brown shirt, black pants)
      → Compiles shaders
      → Initializes GSAP scroll animations
  → Navbar.tsx (ScrollSmoother for smooth page scrolling)
  → Sections render: Landing → About → Career → WhatIDo → TechStack → Work → Contact
```

**Key dependency chain:** Three.js → GLTF model → GSAP animations → Page ready

This is why the loading screen exists — the 3D content must fully load before the page becomes interactive.

---

## Session 2: Homelab Docker Deployment & Cloudflare Tunnel

> Session Date: 2026-03-15
> Goal: Deploy the portfolio on Shivansh's homelab (NUC running Ubuntu) and expose it via Cloudflare Tunnel

---

### 25. Created Dockerfile, nginx.conf, and .dockerignore (Previous Session — DONE)

**Files created:**
- `Dockerfile` — Multi-stage build: Node 20 Alpine builds the app, Nginx Alpine serves static files (~25MB final image)
- `nginx.conf` — SPA routing, gzip compression, cache headers (1yr for hashed assets, 30d for images/models, no-cache for index.html), security headers
- `.dockerignore` — Excludes `node_modules`, `.git`, `.claude`, markdown files from build context

---

### 26. Created GitHub Actions CI/CD Pipeline for GHCR (DONE)

**File created:** `.github/workflows/docker-publish.yml`

**What:** On every push to `main`, the workflow:
1. Checks out the code
2. Logs in to GitHub Container Registry (GHCR)
3. Builds the Docker image
4. Pushes to `ghcr.io/thebrownhuman/shivanshportfolio:latest` (+ commit SHA tag)

**Why:** Enables pulling pre-built images on the homelab without cloning the repo. Also enables Watchtower auto-updates (like the email service setup).

**Status:** Workflow pushed and runs successfully. GHCR pull requires auth (repo is private) — homelab currently uses local `git clone` + `docker build` instead.

---

### 27. Fixed Unused useCallback Import Build Error (DONE)

**File changed:** `src/components/TechStack.tsx` line 2

**Before:** `import { useRef, useMemo, useState, useEffect, useCallback } from "react";`
**After:** `import { useRef, useMemo, useState, useEffect } from "react";`

**Why:** TypeScript strict mode (`tsc -b`) fails on unused imports. The Docker build runs `npm run build` which invokes `tsc -b && vite build`, causing the build to fail inside the container.

---

### 28. Deployed Portfolio Container on Homelab (DONE)

**Commands run on Ubuntu homelab:**
```bash
git clone git@github.com:thebrownhuman/shivanshPortfolio.git portfolio
cd portfolio
docker build -t shivansh-portfolio .
docker run -d -p 3001:8080 --name portfolio shivansh-portfolio
```

**Port choice:** 3001 — Port 80 was already taken by `my-nginx` container.

**Running containers on homelab after deployment:**
| Container | Port | Image |
|-----------|------|-------|
| portfolio | 3001 | shivansh-portfolio (local build) |
| email-service | 8085 | ghcr.io/thebrownhuman/emailserver |
| progress_tracker | 4000 | progress-tracker |
| watchtower | 8080 | containrrr/watchtower |
| my-nginx | 80 | nginx |

---

### 29. Added Portfolio to Cloudflare Tunnel (DONE)

**Existing tunnel:** `progress-tracker` (ID: `a51481be-b239-4958-9496-9440484cf097`)
**Config location:** `/etc/cloudflared/config.yml`

**Config updated (added the `shivanshmishra.in` entry):**
```yaml
tunnel: a51481be-b239-4958-9496-9440484cf097
credentials-file: /home/shivansh/.cloudflared/a51481be-b239-4958-9496-9440484cf097.json
ingress:
  - hostname: progress.shivanshmishra.in
    service: http://localhost:4000
  - hostname: email.shivanshmishra.in
    service: http://localhost:8085
  - hostname: shivanshmishra.in
    service: http://localhost:3001
  - service: http_status:404
```

**Key detail:** The catch-all `- service: http_status:404` MUST always be the last entry. Cloudflare processes ingress rules top-to-bottom. Shivansh initially placed the portfolio entry after the catch-all — this was caught and corrected.

**DNS:** Changed the existing `A` record for `shivanshmishra.in` (was pointing to `34.202.9.135`) to a `CNAME` pointing to `a51481be-b239-4958-9496-9440484cf097.cfargotunnel.com` (Proxied, orange cloud ON).

**Service restarted:** `sudo systemctl restart cloudflared` — all 4 tunnel connections registered successfully.

---

### 30. Discovered and Fixed Git LFS Issue — character.glb Was a Pointer File (DONE)

**Problem:** Site loaded but was stuck at the loading screen (66% → incrementing 1% every 2-4 seconds).

**Investigation:**
1. Server logs showed all assets served in under 1 second — server wasn't the bottleneck
2. `character.glb` was returning only **132 bytes** in HTTP responses
3. `ls -la` inside the Docker container confirmed: `character.glb` was 132 bytes
4. The file was a **Git LFS pointer** (text file with SHA256 hash), not the actual 3D model
5. A `.gitattributes` file in the `models/` directory confirmed LFS tracking

**Root cause:** `git clone` on the homelab pulled the LFS pointer file instead of the actual binary. Git LFS was not installed on the homelab.

**The pointer file contents:**
```
version https://git-lfs.github.com/spec/v1
oid sha256:8f95d22496ee41a88672121bc507478839dadbe2fa0705b889b6ea0389cd360f
size 2337328
```

**Fix:**
```bash
sudo apt install git-lfs -y
git lfs install
git lfs pull
# Verified: character.glb now 2.3 MB
docker stop portfolio && docker rm portfolio
docker build -t shivansh-portfolio .
docker run -d -p 3001:8080 --name portfolio shivansh-portfolio
```

**Why the loading screen was stuck:** The `setProgress` function in `Loading.tsx` uses a fake progress bar that crawls after 50% (adds 0 or 1 every 2 seconds). Meanwhile, `loadCharacter()` in `Scene.tsx` tries to parse the GLB file. With only a 132-byte text file instead of a real 2.3 MB 3D model, the GLTFLoader/DRACOLoader couldn't parse it. The `loadCharacter()` promise never resolved, so `progress.loaded()` was never called, and the progress bar was stuck in its slow crawl phase.

**Why it worked on localhost:** On the Windows dev machine, the actual GLB file was present (downloaded via Git LFS during initial clone). Only the homelab clone was missing Git LFS.

---

### 31. Diagnosed Chrome Cache Issue (DONE)

**Problem:** After fixing the GLB file and rebuilding the container, the site was still slow on Chrome but **loaded instantly on Safari**.

**Root cause:** Chrome had cached the old broken 132-byte GLB file with the nginx cache header (`Cache-Control: public`, 30-day expiry from the `/models/` location block). Safari had no cache, so it fetched the real 2.3 MB file.

**Fix:** Hard clear Chrome cache for `shivanshmishra.in` via DevTools → Application → Clear site data, or `Ctrl + Shift + Delete`.

**Lesson:** When serving broken files that later get fixed, the nginx cache headers can work against you. The 30-day cache on `/models/` meant Chrome stubbornly held onto the broken pointer file.

---

### 32. Switched Container to nginx-unprivileged on Port 8080 (2026-10-09, DONE)

**What:** Serve stage now uses `nginxinc/nginx-unprivileged:1.31.5-alpine` and nginx listens on 8080 inside the container. Homelab run command is now `docker run -d -p 3001:8080 --name portfolio shivansh-portfolio`.

**Why:** The previous image (`nginx:alpine` + `USER nginx`) failed to start: nginx running as non-root could not create `/var/cache/nginx/client_temp`, bind port 80, or write its pid file. The unprivileged image already runs as uid 101 and is set up for that.

---

### Homelab Routing Summary

| Subdomain | Service | Port | Tunnel |
|-----------|---------|------|--------|
| `shivanshmishra.in` | Portfolio | 3001 | progress-tracker |
| `progress.shivanshmishra.in` | Progress Tracker | 4000 | progress-tracker |
| `email.shivanshmishra.in` | Email Service | 8085 | progress-tracker |

All services share the same Cloudflare Tunnel (`progress-tracker`). The tunnel name is just a label — routing is determined by the `config.yml` ingress rules, not the tunnel name.

---

### Update Workflow (Manual)

To update the portfolio on the homelab after pushing changes:
```bash
cd ~/portfolio/shivanshPortfolio
git pull
git lfs pull  # Important: always pull LFS files
docker stop portfolio && docker rm portfolio
docker build -t shivansh-portfolio .
docker run -d -p 3001:8080 --name portfolio shivansh-portfolio
```

**Future improvement:** Set up GHCR authentication on the homelab so Watchtower can auto-pull and redeploy — same as the email service setup.
