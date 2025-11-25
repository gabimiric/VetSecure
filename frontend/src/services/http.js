// src/services/http.js
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || "http://localhost:8082",
  withCredentials: false, // tokens in header, not cookies
});

// Add response interceptor to handle 401 errors (expired/invalid tokens)
// Note: We only handle 401 here, not 403, because 403 can mean "authenticated but no permission"
// which shouldn't log the user out - let components handle 403 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      // Only handle 401 (Unauthorized) - this means token is invalid/expired
      // 403 (Forbidden) means authenticated but no permission - don't log out
      if (status === 401) {
        console.warn(
          "[http] Received 401 Unauthorized, token may be expired. Clearing auth..."
        );
        // Clear tokens
        localStorage.removeItem("vetsecure_id_token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("current_user");
        localStorage.removeItem("current_user");
        // Clear axios headers
        delete api.defaults.headers.common["Authorization"];
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
      // For 403, just log it but don't redirect - let the component handle it
      if (status === 403) {
        console.warn(
          "[http] Received 403 Forbidden - user may not have permission for this action"
        );
      }
    }
    return Promise.reject(error);
  }
);

// services/http.js
export function setAuthToken(token) {
  if (!api.defaults.headers) api.defaults.headers = {};
  if (!api.defaults.headers.common) api.defaults.headers.common = {};
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export function clearAuthToken() {
  delete api.defaults.headers.common["Authorization"];
}
