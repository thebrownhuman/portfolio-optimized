// The loader and intro play once per tab. Coming back to the home page from the
// /projects pages (nav links, the logo, back/forward) goes straight to the page;
// a reload or a fresh tab plays them again. sessionStorage is per tab, and the
// navigation type tells a reload apart from a link.
const KEY = "introPlayed";

// The page always opens at the top (the intro starts there; the #section
// links jump themselves), never where the browser last left it
if (typeof history !== "undefined") history.scrollRestoration = "manual";

export const skipIntro = (() => {
  try {
    if (sessionStorage.getItem(KEY) !== "1") return false;
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    return nav?.type !== "reload";
  } catch {
    // Storage blocked (private mode, site data off): always play the intro
    return false;
  }
})();

export function markIntroPlayed() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // Not remembered: the next visit plays the intro again
  }
}
