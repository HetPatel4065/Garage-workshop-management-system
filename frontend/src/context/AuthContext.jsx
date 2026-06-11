import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { useLoading } from "./LoadingContext";
import { getDashboardRoute } from "../utils/roles";
import {
  clearSessionHistoryFlag,
  seedSessionHistory,
} from "../utils/authHistory";
import axios from "axios";

// Setup axios interceptor for admin impersonation
axios.interceptors.request.use(
  (config) => {
    const g = sessionStorage.getItem("admin_selected_garage");
    if (g && config.url) {
      try {
        const garage = JSON.parse(g);
        if (garage && garage._id) {
          const backendBaseUrl = import.meta.env.VITE_API_URL.replace(
            /\/api$/,
            "",
          );
          const requestUrl = new URL(config.url, window.location.origin);
          const backendOrigin = new URL(backendBaseUrl).origin;
          const isBackendRequest =
            requestUrl.origin === window.location.origin ||
            requestUrl.origin === backendOrigin ||
            requestUrl.pathname.startsWith("/api");

          if (isBackendRequest) {
            config.headers["x-effective-owner-id"] = garage._id;
          }
        }
      } catch (e) {
        console.error("Error parsing admin_selected_garage in axios:", e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Setup window.fetch override for admin impersonation
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  const g = sessionStorage.getItem("admin_selected_garage");
  if (g) {
    try {
      const garage = JSON.parse(g);
      if (garage && garage._id) {
        const backendBaseUrl = import.meta.env.VITE_API_URL.replace(
          /\/api$/,
          "",
        );
        const requestUrl = new URL(url, window.location.origin);
        const backendOrigin = new URL(backendBaseUrl).origin;
        const isBackendRequest =
          requestUrl.origin === window.location.origin ||
          requestUrl.origin === backendOrigin ||
          requestUrl.pathname.startsWith("/api");

        if (isBackendRequest) {
          if (!options.headers) {
            options.headers = {};
          }
          if (options.headers instanceof Headers) {
            options.headers.set("x-effective-owner-id", garage._id);
          } else {
            options.headers["x-effective-owner-id"] = garage._id;
          }
        }
      }
    } catch (e) {
      console.error("Error parsing admin_selected_garage in fetch:", e);
    }
  }
  return originalFetch.apply(this, [url, options]);
};

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// ─── Token storage helpers (sessionStorage for cross-session persistence) ───────
const TOKEN_KEY = "garage_token";

const getStoredToken = () => sessionStorage.getItem(TOKEN_KEY);

const setStoredToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);

const clearStoredToken = () => sessionStorage.removeItem(TOKEN_KEY);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedGarage, setSelectedGarage] = useState(() => {
    const g = sessionStorage.getItem("admin_selected_garage");
    if (g) {
      try {
        return JSON.parse(g);
      } catch {
        return null;
      }
    }
    return null;
  });

  const { startLoading, stopLoading } = useLoading();
  const navigate = useNavigate();

  // ─── Core logout helper (no navigate — used internally) ────────────────────
  const _clearSession = useCallback(() => {
    clearStoredToken();
    sessionStorage.removeItem("portal_token");
    sessionStorage.removeItem("service_reminder_shown");
    sessionStorage.removeItem("admin_selected_garage");
    clearSessionHistoryFlag();
    setToken(null);
    setUser(null);
    setSelectedGarage(null);
    setIsVerified(false);
  }, []);

  // ─── Initialize: validate stored token on app boot ─────────────────────────
  const initializeAuth = useCallback(async () => {
    const storedToken = getStoredToken();

    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/me?t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Cache-Control": "no-cache",
          },
        },
      );

      if (res.ok) {
        const payload = await res.json();
        const userData = payload?.data ?? payload;
        setUser(userData);
        setToken(storedToken);
        setIsVerified(true);
      } else {
        _clearSession();
      }
    } catch {
      _clearSession();
    } finally {
      setLoading(false);
    }
  }, [_clearSession]);

  useEffect(() => {
    initializeAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Login ────
  const login = async (email, password, garageId) => {
    startLoading("Authenticating…");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, garageId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Login failed");
      }

      const data = await res.json();
      const userData = data.user;
      const jwt = data.token;

      setStoredToken(jwt);
      setToken(jwt);
      setUser(userData);
      setIsVerified(true);

      const dashboardPath = getDashboardRoute(userData?.role);
      navigate(dashboardPath, { replace: true });
      seedSessionHistory(dashboardPath);
    } finally {
      stopLoading();
    }
  };

  // ─── Register ─
  const register = async (formData) => {
    startLoading("Creating Account…");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Registration failed");
      }

      navigate("/owner/login");
    } finally {
      stopLoading();
    }
  };

  // ─── Logout ───
  const logout = useCallback(() => {
    fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {});

    _clearSession();
    navigate("/login", { replace: true });
  }, [_clearSession, navigate, token]);

  const clearAuth = useCallback(() => {
    _clearSession();
  }, [_clearSession]);

  // ─── Refresh user profile from backend ─────────────────────────────────────
  const refreshUser = useCallback(async () => {
    const currentToken = token || getStoredToken();
    if (!currentToken) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/me?t=${Date.now()}`,
        { headers: { Authorization: `Bearer ${currentToken}` } },
      );

      if (res.ok) {
        const payload = await res.json();
        setUser(payload?.data ?? payload);
        setIsVerified(true);
      } else if (res.status === 401) {
        logout();
      }
    } catch {
      /* network glitch — keep current state */
    }
  }, [token, logout]);

  // ─── Garage preview (admin) ─────────────────────────────────────────────────
  const selectGarage = useCallback((garage) => {
    sessionStorage.setItem("admin_selected_garage", JSON.stringify(garage));
    setSelectedGarage(garage);
  }, []);

  // FIX: made async and calls refreshUser() so user.logo is fresh
  // when the sidebar re-renders after exiting preview
  const exitGaragePreview = useCallback(async () => {
    sessionStorage.removeItem("admin_selected_garage");
    setSelectedGarage(null);
    await refreshUser();
    const dashboardPath = getDashboardRoute(user?.role) || "/dashboard";
    clearSessionHistoryFlag();
    navigate(dashboardPath, { replace: true });
    seedSessionHistory(dashboardPath);
  }, [navigate, user, refreshUser]);

  // ─── Expose API ────────────────────────────────────────────────────────────
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isVerified,
        selectedGarage,
        login,
        register,
        logout,
        clearAuth,
        refreshUser,
        selectGarage,
        exitGaragePreview,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
