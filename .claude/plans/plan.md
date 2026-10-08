# Code Review Fixes Plan

Fix all 16 relevant issues from `relevant_code_reviews.md`. No visual changes — all fixes are under the hood.

---

## Phase 1: Quick Wins (5 files, ~5 min each)

### R11. Fix dead resume button — `SocialIcons.tsx:77`
- **Wait for user to provide resume PDF** (user said they'll provide it)
- Once provided: place in `public/`, update `href="#"` → `href="/resume.pdf"` with `target="_blank"` and `rel="noopener noreferrer"`

### R13. Add `rel="noopener noreferrer"` to all external links
- **SocialIcons.tsx:62-74** — 3 links (GitHub, LinkedIn, Instagram) all have `target="_blank"` but no `rel`
- **Contact.tsx:22-44** — 3 links (GitHub, LinkedIn, Instagram) same issue
- **WorkImage.tsx:31** — `target="_blank"` on project links, no `rel`
- **SocialIcons.tsx:77** — Resume button (once href is fixed)

### R14. Fix `overflow: clip` → `overflow: hidden` — `index.css:109`
- `.techstack` uses `overflow: clip` which has limited Safari support
- Change to `overflow: hidden`

### R21. Remove empty useEffect — `LoadingProvider.tsx:27`
- `useEffect(() => {}, [loading])` does literally nothing. Delete the line.

### R20. Delete unused CSS classes
- Search for `.check-line`, `.loading-icon`, `.landing-video`, `.landing-image`, `.character-loaded`
- Verify zero usage in JSX, then delete the CSS rules

---

## Phase 2: Bug Fixes (medium complexity)

### R1. Fix WorkImage.tsx production asset path — `WorkImage.tsx:17`
- `fetch("src/assets/${props.video}")` will 404 in production (Vite doesn't serve `src/` after build)
- **Current state:** No projects in `Work.tsx` pass a `video` prop, so this code path is dead right now
- **Fix:** Change to `fetch(`/videos/${props.video}`)` so it works if videos are added later, OR remove the video feature entirely since it's unused
- **Recommendation:** Remove the video hover feature (dead code) — simplifies component, no visual change

### R2. Fix Loading.tsx side effects during render — `Loading.tsx:13-20`
- `if (percent >= 100) { setTimeout(...) }` runs during render, not in useEffect
- Creates duplicate timers on every re-render when percent >= 100
- **Fix:** Move to `useEffect` with `[percent]` dependency:
  ```tsx
  useEffect(() => {
    if (percent < 100) return;
    const t1 = setTimeout(() => {
      setLoaded(true);
      const t2 = setTimeout(() => setIsLoaded(true), 1000);
      return () => clearTimeout(t2);
    }, 600);
    return () => clearTimeout(t1);
  }, [percent]);
  ```

### R8. Fix TechStack random material in render — `TechStack.tsx:198`
- `materials[Math.floor(Math.random() * materials.length)]` runs in JSX during every render
- Each re-render gives spheres different materials (visual flicker)
- **Fix:** Pre-compute material assignment in the `spheres` array at module level:
  ```ts
  const spheres = [...Array(30)].map(() => ({
    scale: [0.7, 1, 0.8, 1, 1][Math.floor(Math.random() * 5)],
    materialIndex: Math.floor(Math.random() * 8),
  }));
  ```
  Then in JSX: `material={materials[props.materialIndex]}`

---

## Phase 3: Memory Leak Fixes

### R3. Cursor.tsx — RAF + mousemove leak
- `requestAnimationFrame(loop)` runs forever, never cancelled
- `document.addEventListener("mousemove", (e) => ...)` — anonymous, can't be removed
- `mouseover`/`mouseout` listeners on `[data-cursor]` elements — anonymous, never cleaned up
- **Fix:** Store RAF ID, use named functions, return cleanup function from useEffect

### R4. SocialIcons.tsx — RAF leak + wrong cleanup target
- `requestAnimationFrame(updatePosition)` inside forEach — runs infinite loop per icon, never cancelled
- Cleanup does `elem.removeEventListener("mousemove")` but listener was added to `document`
- **Fix:** Store all RAF IDs and named listeners, clean up properly. Also fix R9 (stale rect) at the same time — recalculate rect on mousemove instead of caching once at mount

### R5. Navbar.tsx — Resize + click listeners never cleaned up
- `window.addEventListener("resize", () => ...)` — anonymous function, can't be removed
- Click listeners on `.header a` elements — never cleaned up
- **Fix:** Use named functions, return cleanup function

### R6. Scene.tsx — Stacking touchmove listeners
- Inside `onTouchStart`, a new `touchmove` listener is added to `element` on every touch
- Tap 10 times = 10 `touchmove` handlers stacked
- **Fix:** Add touchmove listener once outside of touchstart, or use `{ once: true }` pattern, or track and remove properly

### R7. splitText.ts — Recursive ScrollTrigger refresh listener
- `ScrollTrigger.addEventListener("refresh", () => setSplitText())` at line 79
- Every call to `setSplitText()` adds ANOTHER "refresh" listener
- Resize → refresh → setSplitText() → adds listener → next refresh → setSplitText() again → adds another listener → exponential growth
- **Fix:** Add a module-level guard flag:
  ```ts
  let refreshListenerAdded = false;
  // ...at end of function:
  if (!refreshListenerAdded) {
    ScrollTrigger.addEventListener("refresh", () => setSplitText());
    refreshListenerAdded = true;
  }
  ```

---

## Phase 4: Minor Fixes

### R9. SocialIcons.tsx — Stale getBoundingClientRect (fixed alongside R4)
- `rect` is captured once at mount. After page scroll, coordinates are wrong
- **Fix:** Recalculate rect inside the mousemove handler

### R10. character.ts — Race condition (resolve before setup)
- `resolve(gltf)` at line 46, then `setCharTimeline` + bone positioning at lines 47-50
- Scene.tsx receives the gltf and starts using it before bones are positioned
- **Fix:** Move `resolve(gltf)` after all setup is complete (after line 50)

### R12. Add SEO meta tags — `index.html`
- Add meta description, Open Graph tags (title, description, image, url), favicon
- **Wait for user input:** Need the site URL and preview image path for OG tags. Will use `preview.png` and `shivanshmishra.in`

---

## Summary

| Phase | Issues | Files Changed | Risk |
|-------|--------|---------------|------|
| 1: Quick Wins | R11, R13, R14, R20, R21 | 6 files | Zero — adding attributes, deleting dead code |
| 2: Bug Fixes | R1, R2, R8 | 3 files | Low — fixing render-time side effects |
| 3: Memory Leaks | R3, R4, R5, R6, R7 | 5 files | Medium — rewriting useEffect cleanup logic |
| 4: Minor | R9, R10, R12 | 3 files | Low — moving lines, adding meta tags |

**Total: 16 issues across ~12 files. Zero visual changes.**
