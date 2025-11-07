import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins: Array<any> = [react()];

  // Dynamically import optional dev-only plugin to avoid startup errors when it's not installed
  if (mode === "development") {
    try {
      const mod = await import("vite-plugin-component-tagger");
      if (mod && typeof mod.componentTagger === 'function') {
        plugins.push(mod.componentTagger());
      }
    } catch (err) {
      // plugin not available; continue without it
      // console.debug('Optional plugin vite-plugin-component-tagger not loaded:', err);
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
