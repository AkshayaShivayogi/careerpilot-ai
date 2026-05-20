import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { getToken, getRefreshToken, setSessionTokens } from "../services/tokenStore.js";
import { setStoredUser } from "../services/userStore.js";
import { clearAllAuthStorage, purgeInvalidAuthStorage, isAccessTokenExpired } from "../services/authStorage.js";
import { getErrorMessage } from "../utils/httpError.js";

const AuthContext = createContext(null);

function parseUser(data) {
  if (data?.user) return data.user;
  return null;
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const clearSession = useCallback(() => {
    clearAllAuthStorage();
    setUser(null);
  }, []);

  const persistSession = useCallback((accessToken, userData, refreshToken) => {
    clearAllAuthStorage();
    if (!accessToken || !userData?.email) {
      throw new Error("Invalid auth response from server");
    }
    setSessionTokens({ accessToken, refreshToken });
    setStoredUser(userData);
    setUser(userData);
  }, []);

  const restoreSession = useCallback(async () => {
    purgeInvalidAuthStorage();

    const token = getToken();
    if (!token) {
      setUser(null);
      return null;
    }

    if (isAccessTokenExpired(token)) {
      clearSession();
      return null;
    }

    try {
      const { data } = await api.get("/auth/me");
      const me = parseUser(data);
      if (!me?.email) throw new Error("Invalid session response");
      setStoredUser(me);
      setUser(me);
      return me;
    } catch (e) {
      if (e.response?.status === 401 && getRefreshToken()) {
        try {
          const { data } = await api.post("/auth/refresh", { refreshToken: getRefreshToken() });
          const access = data?.accessToken || data?.token;
          if (access) {
            setSessionTokens({
              accessToken: access,
              refreshToken: data.refreshToken || getRefreshToken(),
            });
            const { data: meData } = await api.get("/auth/me");
            const me = parseUser(meData);
            if (me?.email) {
              setStoredUser(me);
              setUser(me);
              return me;
            }
          }
        } catch {
          /* refresh failed */
        }
      }
      clearSession();
      throw e;
    }
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      purgeInvalidAuthStorage();
      try {
        if (getToken()) {
          await restoreSession();
        } else {
          clearSession();
        }
      } catch (e) {
        if (!cancelled) {
          console.warn("[auth] restoreSession failed:", getErrorMessage(e));
          clearSession();
        }
      } finally {
        if (!cancelled) setInitialized(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [restoreSession, clearSession]);

  const signup = useCallback(
    async (payload) => {
      clearSession();
      const { data } = await api.post("/auth/signup", {
        fullName: payload.fullName || payload.name,
        email: String(payload.email || "").trim().toLowerCase(),
        password: payload.password,
      });
      const access = data?.accessToken || data?.token;
      if (!access || !data?.user) {
        throw new Error(data?.message || "Signup failed");
      }
      persistSession(access, data.user, data.refreshToken);
      return data.user;
    },
    [persistSession, clearSession]
  );

  const login = useCallback(
    async (email, password) => {
      clearSession();
      const { data } = await api.post("/auth/login", {
        email: String(email || "").trim().toLowerCase(),
        password,
      });
      const access = data?.accessToken || data?.token;
      if (!access || !data?.user) {
        throw new Error(data?.message || "Invalid email or password");
      }
      persistSession(access, data.user, data.refreshToken);
      return data.user;
    },
    [persistSession, clearSession]
  );

  const logout = useCallback(async () => {
    try {
      if (getToken()) await api.post("/auth/logout");
    } catch {
      /* always clear locally */
    }
    clearSession();
    navigate("/login", { replace: true });
  }, [clearSession, navigate]);

  const googleLogin = useCallback(
    async (credential) => {
      clearSession();
      const { data } = await api.post("/auth/google", { credential });
      const access = data?.accessToken || data?.token;
      if (!access || !data?.user) {
        throw new Error(data?.message || "Google login failed");
      }
      persistSession(access, data.user, data.refreshToken);
      return data.user;
    },
    [persistSession, clearSession]
  );

  const fetchMe = useCallback(async () => restoreSession(), [restoreSession]);

  const isAuthenticated = Boolean(user?.email && getToken());

  const value = useMemo(
    () => ({
      user,
      initialized,
      loading: !initialized,
      isAuthenticated,
      signup,
      login,
      googleLogin,
      logout,
      fetchMe,
      restoreSession,
      setUser,
      persistSession,
      clearSession,
    }),
    [
      user,
      initialized,
      isAuthenticated,
      signup,
      login,
      googleLogin,
      logout,
      fetchMe,
      restoreSession,
      persistSession,
      clearSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth requires AuthProvider");
  return ctx;
}
