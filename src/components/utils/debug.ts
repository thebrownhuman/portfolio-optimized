// The single switch for debug and test code (the ?debug badge, probes and the
// URL test switches). Off in production builds, where the bundler drops that
// code: on in `npm run dev`, or in a build made with VITE_DEBUG=1
export const DEBUG = import.meta.env.DEV || import.meta.env.VITE_DEBUG === "1";

// URL params for the test switches; always empty in production builds
export const debugParams = new URLSearchParams(DEBUG ? window.location.search : "");
