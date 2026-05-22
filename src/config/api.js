function resolveApiRoot() {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");
  if (import.meta.env.DEV) return "";
  return "https://careerpilot-backend-pdsi.onrender.com";
}

const clean = resolveApiRoot();

export const API_HOST = clean || (typeof window !== "undefined" ? window.location.origin : "");
export const API_ROOT = API_HOST;
export const API_BASE = clean ? `${clean}/api` : "/api";

export const API_TIMEOUT_MS = 30000;
export const SAFE_API_TIMEOUT_MS = API_TIMEOUT_MS;
export const AI_REQUEST_TIMEOUT_MS = 90000;

export function isPublicAiPath(path = "") {
  return String(path).includes("/ai/public");
}