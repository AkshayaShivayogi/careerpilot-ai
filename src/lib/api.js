/**
 * Centralized API helper — fetch wrapper + shared config.
 * Use `api` (axios) for existing calls; use `apiRequest` for fetch with retries.
 */
import { API_BASE, API_HOST, API_TIMEOUT_MS, isPublicAiPath } from "../config/api.js";
import { getToken } from "../services/tokenStore.js";
import { getErrorMessage } from "../utils/httpError.js";

export { API_BASE, API_HOST, API_TIMEOUT_MS, API_ROOT } from "../config/api.js";
export { isPublicAiPath };

export class ApiError extends Error {
  constructor(message, { status, data, offline = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.offline = offline;
  }
}

function buildUrl(path) {
  const p = String(path || "").trim();
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `${API_BASE}${p.startsWith("/") ? p : `/${p}`}`;
}

function parseJsonSafe(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function normalizeSuccessBody(body) {
  if (!body || typeof body !== "object") return body;
  if (body.success === false) {
    throw new ApiError(body.message || body.error || "Request failed", { data: body });
  }
  if (body.data != null && typeof body.data === "object" && !Array.isArray(body.data)) {
    return { ...body, ...body.data, data: body.data };
  }
  return body;
}

/**
 * Low-level fetch with timeout, retries (network/5xx), and auth header.
 */
export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body = undefined,
    headers = {},
    retries = 1,
    timeout = API_TIMEOUT_MS,
    auth = true,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const reqHeaders = { ...headers };
      if (!(body instanceof FormData)) {
        reqHeaders["Content-Type"] = reqHeaders["Content-Type"] || "application/json";
      }

      if (auth) {
        const token = getToken();
        if (token) reqHeaders.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(buildUrl(path), {
        method,
        headers: reqHeaders,
        body:
          body instanceof FormData
            ? body
            : body !== undefined && body !== null
              ? JSON.stringify(body)
              : undefined,
        signal: controller.signal,
        credentials: "include",
      });

      clearTimeout(timer);
      const parsed = parseJsonSafe(await res.text());

      if (!res.ok) {
        const msg =
          parsed?.message ||
          parsed?.error ||
          (res.status >= 500
            ? "Something went wrong on the server. Please try again."
            : `Request failed (${res.status})`);
        throw new ApiError(msg, { status: res.status, data: parsed });
      }

      return normalizeSuccessBody(parsed);
    } catch (err) {
      clearTimeout(timer);

      if (err instanceof ApiError) {
        lastError = err;
        if (attempt < retries && (err.status == null || err.status >= 500)) {
          await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
          continue;
        }
        throw err;
      }

      if (err?.name === "AbortError") {
        lastError = new ApiError("Request timed out. The server may still be starting.", {
          offline: false,
        });
      } else if (!err?.status) {
        lastError = new ApiError(getErrorMessage(err, "Cannot reach the API."), { offline: true });
      } else {
        lastError = new ApiError(getErrorMessage(err), { offline: false });
      }

      if (attempt < retries && lastError.offline) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError;
}

/** Ping backend health (no auth). */
export async function checkApiHealth() {
  try {
    const data = await apiRequest("/health", { retries: 1, timeout: 8000, auth: false });
    return data?.success === true || data?.ok === true;
  } catch {
    return false;
  }
}

export { default } from "../api/axios.js";
export { default as api } from "../api/axios.js";
