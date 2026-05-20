/**
 * API host + base URL (single source of truth).
 *
 * Spec host: import.meta.env.VITE_API_URL || "http://127.0.0.1:5000"
 * Requests use: {host}/api  (or "/api" via Vite proxy in dev)
 */

function normalizeHost(url) {
  return String(url || "")
    .trim()
    .replace(/\/$/, "")
    .replace(/\/api$/i, "");
}

export const API_ROOT = normalizeHost(import.meta.env.VITE_API_URL) || "http://127.0.0.1:5000";

/** Dev: proxy via Vite unless explicitly disabled */
const useProxy =
  import.meta.env.VITE_USE_PROXY === "true" ||
  (import.meta.env.DEV && import.meta.env.VITE_USE_PROXY !== "false");

export const API_HOST = useProxy
  ? typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5173"
  : API_ROOT;

export const API_BASE = useProxy ? "/api" : `${API_ROOT}/api`;

export const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000;

/** Long-running AI routes — cap wait so UI never hangs */
export const AI_REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_AI_TIMEOUT_MS) || 15000;

/** safeApi wrapper default — auto-fallback after this wait */
export const SAFE_API_TIMEOUT_MS = Number(import.meta.env.VITE_SAFE_API_TIMEOUT_MS) || 15000;

export const PUBLIC_AI_PATHS = [
  "/planner/generate",
  "/planner/status",
  "/interview/generate",
  "/interview/submit",
  "/interview/technologies",
  "/interview/streams",
  "/catalog/technologies",
  "/ai/status",
  "/health",
];

export function isPublicAiPath(url = "") {
  return PUBLIC_AI_PATHS.some((p) => String(url).includes(p));
}
