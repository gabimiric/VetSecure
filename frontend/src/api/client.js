// src/api/client.js

// --- Public: submit a clinic request ---
export async function postClinicRequest(payload) {
    const res = await fetch("/api/clinic-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    const res = await fetch(`/api/admin/clinic-requests${q}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// --- Admin: approve (returns created Clinic JSON; OK if you ignore it) ---
export async function approveClinicRequest(id, decidedBy = "admin") {
    const q = decidedBy ? `?decidedBy=${encodeURIComponent(decidedBy)}` : "";
    const res = await fetch(`/api/admin/clinic-requests/${id}/approve${q}`, {
        method: "POST",
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json().catch(() => ({}));
}

// --- Admin: reject (usually empty body) ---
export async function rejectClinicRequest(id, decidedBy = "admin") {
    const q = decidedBy ? `?decidedBy=${encodeURIComponent(decidedBy)}` : "";
    const res = await fetch(`/api/admin/clinic-requests/${id}/reject${q}`, {
        method: "POST",
    });
    if (!res.ok) throw new Error(await res.text());
    return res.text().catch(() => "");
}