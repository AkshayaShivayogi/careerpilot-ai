import axios from "axios";
import { getToken, getRefreshToken, setSessionTokens, clearToken } from "../services/tokenStore.js";
import { setStoredUser } from "../services/userStore.js";
import { clearAllAuthStorage } from "../services/authStorage.js";
import { API_BASE, API_TIMEOUT_MS, AI_REQUEST_TIMEOUT_MS, isPublicAiPath } from "../config/api.js";

const AI_PATH_HINTS = ["/planner/generate", "/interview/generate", "/interview/submit", "/resume/analyze", "/ai/"];

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: API_TIMEOUT_MS,
});

let refreshing = null;

function isNetworkError(error) {
  return (
    !error?.response &&
    (error?.code === "ERR_NETWORK" ||
      error?.message === "Network Error" ||
      error?.code === "ECONNABORTED")
  );
}

function applyRefreshTokens(data) {
  const access = data?.accessToken || data?.token;
  const refresh = data?.refreshToken;
  if (!access) return false;
  setSessionTokens({ accessToken: access, refreshToken: refresh });
  if (data?.user) setStoredUser(data.user);
  return true;
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) delete config.headers["Content-Type"];
  const url = String(config.url || "");
  if (AI_PATH_HINTS.some((p) => url.includes(p))) {
    config.timeout = AI_REQUEST_TIMEOUT_MS;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original) return Promise.reject(error);

    const url = String(original.url || "");
    const status = error.response?.status;

    if (isNetworkError(error)) {
      return Promise.reject(error);
    }

    const skipRefresh =
      url.includes("/auth/login") ||
      url.includes("/auth/signup") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/google");

    if (status === 401 && !skipRefresh && !original._retry) {
      const refresh = getRefreshToken();
      if (refresh) {
        original._retry = true;
        try {
          if (!refreshing) {
            refreshing = axios.post(`${API_BASE}/auth/refresh`, { refreshToken: refresh });
          }
          const { data } = await refreshing;
          refreshing = null;
          if (!applyRefreshTokens(data)) {
            throw new Error("Invalid refresh response");
          }
          original.headers.Authorization = `Bearer ${getToken()}`;
          return api(original);
        } catch {
          refreshing = null;
          if (!isPublicAiPath(url)) {
            clearAllAuthStorage();
          }
        }
      } else if (!isPublicAiPath(url)) {
        clearAllAuthStorage();
      }
    }

    return Promise.reject(error);
  }
);

export { API_BASE, API_TIMEOUT_MS };
export default api;
