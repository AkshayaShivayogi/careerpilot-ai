/**
 * Central auth storage — clear stale/corrupt sessions on logout or account switch.
 */
import { clearToken, getToken, TOKEN_KEY, REFRESH_KEY } from "./tokenStore.js";
import { clearStoredUser, getStoredUser, USER_KEY } from "./userStore.js";

const LEGACY_KEYS = ["token", "user", "auth_user", "careerpilot_auth", "careerpilot_session"];

export function decodeJwtPayload(token) {
  try {
    const part = String(token || "").split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isLikelyJwt(token) {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 8);
}

export function isAccessTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000 - 5000;
}

/** Remove orphan cached user, malformed tokens, or expired JWT before restore. */
export function purgeInvalidAuthStorage() {
  const token = getToken();
  const cachedUser = getStoredUser();

  const invalid =
    (cachedUser && !token) ||
    (token && !isLikelyJwt(token)) ||
    (token && isAccessTokenExpired(token));

  if (invalid) {
    clearAllAuthStorage();
    return true;
  }
  return false;
}

export function clearAllAuthStorage() {
  clearToken();
  clearStoredUser();
  try {
    for (const key of LEGACY_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem("careerpilot_interview_session_v1");
    sessionStorage.removeItem("careerpilot_interview_session_v1");
  } catch {
    /* private mode */
  }
}
