// src/auth/AuthProvider.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { setAuthToken, clearAuthToken } from "../services/http";

// Optional: decode JWT without verifying (purely for UI)
function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8082";
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState(null);

  // Load from storage on mount
  useEffect(() => {
    // Prefer unified OAuth token if present; otherwise fall back to legacy access_token
    let saved = localStorage.getItem("vetsecure_id_token");
    if (!saved) {
      saved =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");
    }
    if (saved) {
      const claims = parseJwt(saved);
      // Check if token is expired
      if (claims && claims.exp) {
        const expirationTime = claims.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        if (currentTime >= expirationTime) {
          console.warn("[AuthProvider] Token expired, clearing auth");
          // Token expired, clear it
          localStorage.removeItem("vetsecure_id_token");
          localStorage.removeItem("access_token");
          sessionStorage.removeItem("access_token");
          clearAuthToken();
          setLoading(false);
          return;
        }
      }

      setToken(saved);
      setAuthToken(saved);
      const userData = {
        ...claims,
        id: claims?.sub ? parseInt(claims.sub, 10) : undefined,
        email: claims.email,
        username: claims.username || claims.email?.split("@")[0] || "user",
        role: claims.role || "PET_OWNER",
      };
      setUser(userData);
      console.log("[AuthProvider] Initialized user from token:", userData);
    }
    setLoading(false);
  }, []);

  // Allow external callers (e.g. LoginPage) to complete login and populate context
  const completeLogin = useCallback((accessToken, refreshToken) => {
    if (!accessToken) return;
    setToken(accessToken);
    setAuthToken(accessToken);
    localStorage.setItem("vetsecure_id_token", accessToken);
    localStorage.setItem("access_token", accessToken);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);

    const claims = parseJwt(accessToken);
    const userData = {
      ...claims,
      id: parseInt(claims.sub, 10),
      email: claims.email,
      username: claims.username || claims.email?.split("@")[0] || "user",
      role: claims.role || "PET_OWNER",
    };
    setUser(userData);
    sessionStorage.setItem("current_user", JSON.stringify(userData));
    localStorage.setItem("current_user", JSON.stringify(userData));
    console.log("[AuthProvider] completeLogin - user set", userData);
  }, []);

  const signInWithGoogle = useCallback(async (idToken) => {
    try {
      // Call the backend OAuth gateway to check MFA status
      const response = await fetch(`${API_BASE}/api/auth/google/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Login failed" }));
        throw new Error(error.error || "Google login failed");
      }

      const data = await response.json();

      // Case 1: MFA required - store mfaToken and show dialog
      if (data.mfaRequired) {
        console.log("[OAuth] MFA required, showing dialog");
        setMfaToken(data.mfaToken);
        setMfaRequired(true);
        return;
      }

      // Case 2: No MFA - complete login with access token
      if (data.accessToken) {
        const claims = parseJwt(data.accessToken);
        const userData = {
          ...claims,
          id: parseInt(claims.sub, 10), // Extract user ID from 'sub' claim
          email: claims.email,
          username: claims.email?.split("@")[0] || "user",
          role: claims.role || "PET_OWNER",
        };

        setToken(data.accessToken);
        setAuthToken(data.accessToken);
        setUser(userData);

        // Store tokens
        localStorage.setItem("vetsecure_id_token", data.accessToken);
        localStorage.setItem("access_token", data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem("refresh_token", data.refreshToken);
        }

        // Sync with AuthService for DashboardRouter compatibility
        sessionStorage.setItem("access_token", data.accessToken);
        sessionStorage.setItem("current_user", JSON.stringify(userData));
        localStorage.setItem("current_user", JSON.stringify(userData));

        console.log("[OAuth] User authenticated:", userData);
      }
    } catch (error) {
      console.error("[OAuth] Login error:", error);
      throw error; // Re-throw so LoginPage can handle it
    }
  }, []);

  const handleMfaVerified = useCallback((accessToken, refreshToken) => {
    setToken(accessToken);
    setAuthToken(accessToken);
    localStorage.setItem("vetsecure_id_token", accessToken);
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    sessionStorage.setItem("access_token", accessToken);

    const claims = parseJwt(accessToken);
    const userData = {
      ...claims,
      id: parseInt(claims.sub, 10), // Extract user ID from 'sub' claim
      email: claims.email,
      username: claims.email?.split("@")[0] || "user",
      role: claims.role || "PET_OWNER",
    };
    setUser(userData);
    sessionStorage.setItem("current_user", JSON.stringify(userData));
    localStorage.setItem("current_user", JSON.stringify(userData));

    // Close MFA dialog
    setMfaRequired(false);
    setMfaToken(null);
    console.log("[MFA] Verification successful");
  }, []);

  const cancelMfa = useCallback(() => {
    setMfaRequired(false);
    setMfaToken(null);
    console.log("[MFA] Verification cancelled");
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setToken(null);
    clearAuthToken();
    setMfaRequired(false);
    setMfaToken(null);

    // Clear all auth storage (OAuth + traditional)
    localStorage.removeItem("vetsecure_id_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    localStorage.removeItem("refresh_token");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("current_user");

    console.log("[Auth] User signed out");
  }, []);

  const requestMfa = useCallback((token) => {
    setMfaToken(token);
    setMfaRequired(true);
  }, []);

  const value = useMemo(
    () => ({
      loading,
      token,
      user,
      isAuthenticated: !!token,
      mfaRequired,
      mfaToken,
      signInWithGoogle,
      handleMfaVerified,
      cancelMfa,
      requestMfa,
      signOut,
      logout: signOut,
      completeLogin,
      hasRole: (role) => {
        // If you map roles from `user` or a /me endpoint, check them here.
        // For now, allow if authenticated.
        return !!token;
      },
    }),
    [
      loading,
      token,
      user,
      mfaRequired,
      mfaToken,
      signInWithGoogle,
      handleMfaVerified,
      cancelMfa,
      requestMfa,
      signOut,
      completeLogin,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
