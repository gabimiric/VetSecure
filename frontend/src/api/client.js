// src/api/client.js

import axios from "axios";

const API_BASE =
    process.env.REACT_APP_API_BASE ||
    (process.env.NODE_ENV === "development" ? "http://localhost:8082" : "");
if (!API_BASE) throw new Error("Missing REACT_APP_API_BASE");


// --- Public: submit a clinic request ---
export async function postClinicRequest(payload) {
  const token =
    localStorage.getItem("vetsecure_id_token") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");
  const res = await fetch(`${API_BASE}/api/clinic-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (res.ok) return res.json();

  let message = `HTTP ${res.status}`;
  try {
    const data = await res.json();
    message = data?.message || data?.error || message;
  } catch (_) {}
  const error = new Error(message);
  error.status = res.status;
  throw error;
}

// --- Admin: list requests by status (defaults handled by backend) ---
export async function getAdminClinicRequests(status) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(`/api/admin/clinics${q}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// --- Admin: approve (returns created Clinic JSON; OK if you ignore it) ---
export async function approveClinicRequest(id, decidedBy = "admin") {
  const q = decidedBy ? `?decidedBy=${encodeURIComponent(decidedBy)}` : "";
  const res = await fetch(`/api/admin/clinics/${id}/approve${q}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json().catch(() => ({}));
}

// --- Admin: reject (usually empty body) ---
export async function rejectClinicRequest(id, decidedBy = "admin") {
  const q = decidedBy ? `?decidedBy=${encodeURIComponent(decidedBy)}` : "";
  const res = await fetch(`/api/admin/clinics/${id}/reject${q}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.text().catch(() => "");
}

// Add a default axios client so other modules can `import client from "../../api/client"`
const client = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

export default client;
