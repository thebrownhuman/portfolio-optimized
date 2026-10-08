import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep the heavy TechStack-only libraries out of the character's path
        manualChunks(id) {
          // Shared helpers/React get their own chunks; otherwise Rollup hoists them into
          // the first manual chunk that uses them and the entry ends up importing rapier
          if (id.includes("vite/preload-helper") || id.includes("commonjsHelpers")) return "helpers";
          if (!id.includes("node_modules")) return;
          if (/node_modules[\/](react|react-dom|scheduler)[\/]/.test(id)) return "react";
          // The character's loaders (GLTF/Draco/RGBE); shared with drei, so pin it
          if (id.includes("three-stdlib")) return "three-stdlib";
          if (id.includes("@dimforge") || id.includes("@react-three/rapier")) return "rapier";
          if (id.includes("postprocessing") || id.includes("n8ao")) return "postprocessing";
          if (/node_modules[\\/]three[\\/]/.test(id)) return "three";
        },
      },
    },
  },
});
