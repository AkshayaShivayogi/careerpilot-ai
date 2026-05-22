/** Stable API config for CareerPilot */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://careerpilot-backend-pdsi.onrender.com";

export const API_BASE = API_URL.replace(/\/+$/, "");

export const API_ROOT = API_BASE.replace(/\/api$/, "");

export const API_HOST = API_ROOT;

export const API_TIMEOUT_MS = 30000;

export function isPublicAiPath(path = "") {
  return String(path).includes("/ai/public");
}

if (typeof window !== "undefined") {
  console.info("[CareerPilot] API_BASE =", API_BASE);
  console.info("[CareerPilot] API_ROOT =", API_ROOT);
}