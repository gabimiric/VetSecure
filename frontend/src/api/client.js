// src/api/client.js
export async function postClinicRequest(payload) {
    const res = await fetch('/api/clinic-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    // 2xx
    if (res.ok) return res.json();

    // Validation or server error -> bubble details to UI
    let message = `HTTP ${res.status}`;
    try {
        const data = await res.json();
        message = data?.message || data?.error || message;
    } catch (_) {}
    const error = new Error(message);
    error.status = res.status;
    throw error;
}