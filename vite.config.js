import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readServerPort() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "server", ".dev-port"), "utf8").trim();
    if (/^\d+$/.test(raw)) return raw;
  } catch {
    /* not ready */
  }
  return "5000";
}

const apiTarget = `http://127.0.0.1:${readServerPort()}`;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@interview-factory": path.resolve(__dirname, "server/services/interviewQuestionFactory"),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname), path.resolve(__dirname, "server")],
    },
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
      "/uploads": { target: apiTarget, changeOrigin: true },
    },
  },
});
