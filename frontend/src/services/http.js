// src/services/http.js
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || "http://localhost:8082",
  withCredentials: false, // tokens in header, not cookies
});

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