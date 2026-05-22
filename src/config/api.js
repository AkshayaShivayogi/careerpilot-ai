const RAW_API =
  import.meta.env.VITE_API_URL ||
  "https://careerpilot-backend-pdsi.onrender.com";

const clean = RAW_API.replace(/\/+$/, "");

export const API_HOST = clean;
export const API_ROOT = clean;
export const API_BASE = `${clean}/api`;
export const API_TIMEOUT_MS = 30000;

export function isPublicAiPath(path = "") {
  return String(path).includes("/ai/public");
}

export default {
  API_HOST,
  API_ROOT,
  API_BASE,
  API_TIMEOUT_MS,
  isPublicAiPath,
};