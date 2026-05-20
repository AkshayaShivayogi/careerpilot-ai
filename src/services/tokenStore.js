/** JWT storage — access + refresh tokens */
export const TOKEN_KEY = "careerpilot_token";
export const REFRESH_KEY = "careerpilot_refresh";
const LEGACY_KEY = "token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(LEGACY_KEY);
  } else {
    clearToken();
  }
}

export function setRefreshToken(token) {
  if (token) localStorage.setItem(REFRESH_KEY, token);
  else localStorage.removeItem(REFRESH_KEY);
}

export function setSessionTokens({ accessToken, refreshToken }) {
  setToken(accessToken);
  if (refreshToken) setRefreshToken(refreshToken);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(LEGACY_KEY);
}
