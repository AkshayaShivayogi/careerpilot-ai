/**
 * Centralized safe API wrapper — never leaves pages without data or stuck loading.
 * Returns fallback payloads on network/timeout/5xx/malformed responses.
 */
import api from "../services/api.js";
import { SAFE_API_TIMEOUT_MS } from "../config/api.js";
import { parseApiBody } from "./parseApi.js";

function withTimeout(promise, ms = SAFE_API_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error("Request timed out");
      err.code = "ECONNABORTED";
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function parseResponseSafe(body) {
  if (body == null) return {};
  if (typeof body === "string") {
    try {
      return parseApiBody(JSON.parse(body));
    } catch {
      return { message: body };
    }
  }
  if (typeof body !== "object") return { data: body };
  try {
    return parseApiBody(body);
  } catch {
    return body;
  }
}

function pickPayload(parsed, responseData) {
  if (!parsed || typeof parsed !== "object") return responseData ?? {};
  if (parsed.analysis) return parsed;
  if (parsed.session || parsed.plan) return parsed;
  if (parsed.dsa) return parsed;
  if (parsed.data != null && typeof parsed.data === "object" && !Array.isArray(parsed.data)) {
    return parsed.data;
  }
  return parsed;
}

function shouldRetry(err, attempt, maxRetries) {
  if (attempt >= maxRetries) return false;
  if (err?.code === "ECONNABORTED") return false;
  const status = err?.response?.status ?? err?.status;
  if (!status) return true;
  return status >= 500;
}

/**
 * @returns {{ ok: boolean, data: any, usedFallback: boolean, error: Error|null, status?: number }}
 */
export async function safeApiCall(requestFn, options = {}) {
  const {
    fallback = null,
    timeout = SAFE_API_TIMEOUT_MS,
    parse = true,
    retries = 1,
    retryDelay = 400,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await withTimeout(requestFn(), timeout);
      const body = response?.data;
      const parsed = parse ? parseResponseSafe(body) : body;
      const data = pickPayload(parsed, body);

      if (parsed?.success === false && fallback != null) {
        const fb = typeof fallback === "function" ? fallback(null) : fallback;
        return { ok: false, data: fb, usedFallback: true, error: new Error(parsed.message || "Request failed") };
      }

      return { ok: true, data, usedFallback: false, error: null, status: response?.status };
    } catch (err) {
      lastError = err;
      if (shouldRetry(err, attempt, retries)) {
        await new Promise((r) => setTimeout(r, retryDelay * (attempt + 1)));
        continue;
      }
      break;
    }
  }

  const err = lastError;
  const status = err?.response?.status ?? err?.status;
  const fb = typeof fallback === "function" ? fallback(err) : fallback;
  if (fb != null) {
    return { ok: false, data: fb, usedFallback: true, error: err, status };
  }
  return { ok: false, data: null, usedFallback: false, error: err, status };
}

export const safeApi = {
  get(url, config = {}, options = {}) {
    return safeApiCall(() => api.get(url, config), options);
  },
  post(url, body, config = {}, options = {}) {
    return safeApiCall(() => api.post(url, body, config), options);
  },
  patch(url, body, config = {}, options = {}) {
    return safeApiCall(() => api.patch(url, body, config), options);
  },
  delete(url, config = {}, options = {}) {
    return safeApiCall(() => api.delete(url, config), options);
  },
};

export { SAFE_API_TIMEOUT_MS };
