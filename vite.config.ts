import path from "node:path";

import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = import.meta.dirname;

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1100,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-map",
              test: /node_modules[\\/]maplibre-gl/u,
            },
            {
              name: "vendor-charts",
              test: /node_modules[\\/](?<pkg>recharts|d3-|@reduxjs)/u,
            },
            {
              name: "vendor-motion",
              test: /node_modules[\\/]motion/u,
            },
          ],
        },
      },
    },
  },
  plugins: [cloudflare(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
      "@scripts": path.resolve(rootDir, "scripts"),
    },
  },
});
