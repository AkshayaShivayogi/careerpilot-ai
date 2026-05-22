const RENDER_BACKEND = "https://careerpilot-backend-pdsi.onrender.com";
const LOCALHOST_RE = /localhost|127\.0\.0\.1/i;

function resolveBackendRoot() {
  const raw = import.meta.env.VITE_API_URL?.trim();

  if (import.meta.env.DEV) {
    if (raw && !LOCALHOST_RE.test(raw)) {
      return raw.replace(/\/+$/, "").replace(/\/api$/i, "");
    }
    return "";
  }

  if (raw && !LOCALHOST_RE.test(raw)) {
    return raw.replace(/\/+$/, "").replace(/\/api$/i, "");
  }

  return RENDER_BACKEND;
}

const backendRoot = resolveBackendRoot();

export const RENDER_API_ROOT = RENDER_BACKEND;
export const API_ROOT = backendRoot || RENDER_BACKEND;
export const API_HOST = API_ROOT;
export const API_BASE =
  import.meta.env.DEV && !backendRoot ? "/api" : `${API_ROOT.replace(/\/+$/, "")}/api`;

export const API_TIMEOUT_MS = 60000;

export function isPublicAiPath(path = "") {
  return String(path).includes("/ai/public");
}

if (typeof window !== "undefined") {
  console.info("[CareerPilot] API_BASE =", API_BASE);
}
