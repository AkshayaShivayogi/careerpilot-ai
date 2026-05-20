import { API_HOST } from "../config/api.js";

/** Resolve /uploads/... paths to full API origin URL */
export function resolveMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = API_HOST.replace(/\/$/, "");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
