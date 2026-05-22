/**
 * Centralized API helper — fetch wrapper + shared config.
 */
import {
  API_BASE,
  API_HOST,
  API_TIMEOUT_MS,
  API_ROOT,
  isPublicAiPath,
} from "../config/api.js";

import { getToken } from "../services/tokenStore.js";
import { getErrorMessage } from "../utils/httpError.js";

export {
  API_BASE,
  API_HOST,
  API_TIMEOUT_MS,
  API_ROOT,
  isPublicAiPath,
};

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

  if (p.startsWith("http://") || p.startsWith("https://")) {
    return p;
  }

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

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    timeout = API_TIMEOUT_MS,
    auth = true,
  } = options;

  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const reqHeaders = { ...headers };

    if (!(body instanceof FormData)) {
      reqHeaders["Content-Type"] =
        reqHeaders["Content-Type"] || "application/json";
    }

    if (auth) {
      const token = getToken();

      if (token) {
        reqHeaders.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(buildUrl(path), {
      method,
      headers: reqHeaders,
      body:
        body instanceof FormData
          ? body
          : body != null
          ? JSON.stringify(body)
          : undefined,
      signal: controller.signal,
      credentials: "include",
    });

    clearTimeout(timer);

    const parsed = parseJsonSafe(await response.text());

    if (!response.ok) {
      throw new ApiError(
        parsed?.message || `Request failed (${response.status})`,
        {
          status: response.status,
          data: parsed,
        }
      );
    }

    return parsed;
  } catch (err) {
    clearTimeout(timer);

    if (err?.name === "AbortError") {
      throw new ApiError("Request timed out");
    }

    throw new ApiError(getErrorMessage(err));
  }
}

export async function checkApiHealth() {
  try {
    const data = await apiRequest("/health", {
      auth: false,
    });

    return Boolean(data);
  } catch {
    return false;
  }
}