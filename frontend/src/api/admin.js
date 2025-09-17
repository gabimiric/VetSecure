const API = process.env.REACT_APP_API || "http://localhost:8082";

export async function listClinicRequests(status = "PENDING") {
    const res = await fetch(`${API}/api/admin/clinic-requests?status=${encodeURIComponent(status)}`);
    if (!res.ok) throw new Error(`List failed: ${res.status}`);
    return res.json();
}

export async function approveClinicRequest(id) {
    const res = await fetch(`${API}/api/admin/clinic-requests/${id}/approve`, { method: "POST" });
    if (!res.ok) throw new Error(`Approve failed: ${res.status}`);
    return res.json();
}

export async function rejectClinicRequest(id) {
    const res = await fetch(`${API}/api/admin/clinic-requests/${id}/reject`, { method: "POST" });
    if (!res.ok) throw new Error(`Reject failed: ${res.status}`);
    return true;
}