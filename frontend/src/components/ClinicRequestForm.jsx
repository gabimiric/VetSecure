import React, { useState } from "react";
import { postClinicRequest } from "../api/client"; // ✅ use the actual export name

const input = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    outline: "none",
};
const label = { fontWeight: 600, marginTop: 12, marginBottom: 6, display: "block" };

export default function ClinicRequestForm() {
    const [form, setForm] = useState({
        clinicName: "",
        address: "",
        city: "",
        phone: "",
        adminName: "",
        adminEmail: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [okMsg, setOkMsg] = useState("");
    const [errMsg, setErrMsg] = useState("");

    function set(k, v) {
        setForm((prev) => ({ ...prev, [k]: v }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        setOkMsg("");
        setErrMsg("");
        setSubmitting(true);
        try {
            // ENSURE KEYS MATCH BACKEND: clinicName, address, city, phone, adminName, adminEmail
            const res = await postClinicRequest(form); // ✅ fixed call
            setOkMsg(`Request #${res.id} submitted! Status: ${res.status}`);
            setForm({ clinicName: "", address: "", city: "", phone: "", adminName: "", adminEmail: "" });
        } catch (err) {
            try {
                const body = await err.response?.json?.();
                if (body?.error === "validation_failed" && body.fields) {
                    const first = Object.entries(body.fields)[0];
                    setErrMsg(`${first[0]}: ${first[1]}`);
                } else if (body?.error) {
                    setErrMsg(String(body.error));
                } else {
                    setErrMsg(err.message || "Failed to submit.");
                }
            } catch {
                setErrMsg(err.message || "Failed to submit.");
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={{ maxWidth: 680, margin: "24px auto", padding: "0 16px" }}>
            <h2>Apply your clinic</h2>
            <p>Fill this form to request onboarding. We’ll review and notify you by email.</p>

            {okMsg && (
                <div
                    style={{
                        background: "#ecfdf5",
                        border: "1px solid #34d399",
                        padding: 10,
                        borderRadius: 8,
                        margin: "12px 0",
                    }}
                >
                    {okMsg}
                </div>
            )}
            {errMsg && (
                <div
                    style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        padding: 10,
                        borderRadius: 8,
                        margin: "12px 0",
                    }}
                >
                    {errMsg}
                </div>
            )}

            <form onSubmit={onSubmit}>
                <label style={label}>Clinic name*</label>
                <input
                    style={input}
                    value={form.clinicName}
                    onChange={(e) => set("clinicName", e.target.value)}
                    required
                />

                <label style={label}>Address*</label>
                <input
                    style={input}
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    required
                />

                <label style={label}>City</label>
                <input style={input} value={form.city} onChange={(e) => set("city", e.target.value)} />

                <label style={label}>Phone</label>
                <input style={input} value={form.phone} onChange={(e) => set("phone", e.target.value)} />

                <label style={label}>Admin name*</label>
                <input
                    style={input}
                    value={form.adminName}
                    onChange={(e) => set("adminName", e.target.value)}
                    required
                />

                <label style={label}>Admin email*</label>
                <input
                    type="email"
                    style={input}
                    value={form.adminEmail}
                    onChange={(e) => set("adminEmail", e.target.value)}
                    required
                />

                <button
                    type="submit"
                    disabled={submitting}
                    style={{
                        marginTop: 16,
                        width: "100%",
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: 0,
                        color: "white",
                        background: "linear-gradient(90deg,#6366f1,#2563eb)",
                        cursor: submitting ? "not-allowed" : "pointer",
                        opacity: submitting ? 0.7 : 1,
                    }}
                >
                    {submitting ? "Submitting…" : "Submit request"}
                </button>
            </form>
        </div>
    );
}