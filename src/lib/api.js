/** Production Render backend — never use localhost in production builds. */
export const RENDER_API_ROOT = "https://careerpilot-backend-pdsi.onrender.com";

const LOCALHOST_RE = /localhost|127\.0\.0\.1/i;

function resolveApiRoot() {
  const envUrl = import.meta.env.VITE_API_URL?.trim();

  if (import.meta.env.DEV) {
    if (envUrl && !LOCALHOST_RE.test(envUrl)) {
      return envUrl.replace(/\/+$/, "");
    }
    return "";
  }

  if (envUrl && !LOCALHOST_RE.test(envUrl)) {
    return envUrl.replace(/\/+$/, "");
  }

  return RENDER_API_ROOT;
}

const clean = resolveApiRoot();

export const API_BASE =
  import.meta.env.DEV && !clean ? "/api" : `${(clean || RENDER_API_ROOT).replace(/\/+$/, "")}/api`;

export const API_ROOT =
  import.meta.env.DEV && !clean
    ? typeof window !== "undefined"
      ? window.location.origin
      : ""
    : clean || RENDER_API_ROOT;

export const API_HOST = API_ROOT;

export const API_TIMEOUT_MS = 30000;

export function isPublicAiPath(path = "") {
  return String(path).includes("/ai/public");
}

if (typeof window !== "undefined") {
  console.info("[CareerPilot] API_BASE =", API_BASE);
  console.info("[CareerPilot] API_ROOT =", API_ROOT);
}
