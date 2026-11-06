import { defineConfig } from "vite";
import vueJsx from "@vitejs/plugin-vue-jsx";

// The hub serves web/dist as static files, so the build must not need anything at runtime: templates are compiled away,
// every asset is hashed beside the page, and nothing is fetched from anywhere but the hub itself.
export default defineConfig({
  plugins: [vueJsx()],
  build: { outDir: "dist", emptyOutDir: true, assetsInlineLimit: 0 },
});
