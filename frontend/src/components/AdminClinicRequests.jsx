import React, { useEffect, useState } from "react";
import {
    getAdminClinicRequests,
    approveClinicRequest,
    rejectClinicRequest,
} from "../api/client";

const pill = (s) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    background:
        s === "PENDING" ? "#fef3c7" : s === "APPROVED" ? "#dcfce7" : "#fee2e2",
    color: "#111827",
    fontSize: 12,
    fontWeight: 700,
});

export default function AdminClinicRequests() {
    const [status, setStatus] = useState("PENDING");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    async function load() {
        setLoading(true);
        setErr("");
        try {
            const data = await getAdminClinicRequests(status);
            setRows(data);
        } catch (e) {
            setErr(e.message || "Failed to load");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load(); // reload when status changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    async function doApprove(id) {
        await approveClinicRequest(id, "admin");
        await load();
    }
    async function doReject(id) {
        await rejectClinicRequest(id, "admin");
        await load();
    }

    return (
        <div style={{ maxWidth: 1000, margin: "24px auto", padding: "0 16px" }}>
            <h2>Clinic requests</h2>

            <div style={{ margin: "12px 0" }}>
                <label style={{ fontWeight: 600, marginRight: 8 }}>Filter:</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                </select>
            </div>

            {err && (
                <div
                    style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        padding: 10,
                        borderRadius: 8,
                    }}
                >
                    {err}
                </div>
            )}
            {loading && <p>Loading…</p>}
            {!loading && rows.length === 0 && <p>No items.</p>}

            {!loading && rows.length > 0 && (
                <div
                    style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}
                >
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: "#f9fafb" }}>
                        <tr>
                            <th style={{ textAlign: "left", padding: 10 }}>#</th>
                            <th style={{ textAlign: "left", padding: 10 }}>Clinic</th>
                            <th style={{ textAlign: "left", padding: 10 }}>Admin</th>
                            <th style={{ textAlign: "left", padding: 10 }}>Email</th>
                            <th style={{ textAlign: "left", padding: 10 }}>City</th>
                            <th style={{ textAlign: "left", padding: 10 }}>Phone</th>
                            <th style={{ textAlign: "left", padding: 10 }}>Status</th>
                            <th style={{ textAlign: "left", padding: 10 }}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((r) => (
                            <tr key={r.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                                <td style={{ padding: 10 }}>{r.id}</td>
                                <td style={{ padding: 10 }}>{r.clinicName}</td>
                                <td style={{ padding: 10 }}>{r.adminName}</td>
                                <td style={{ padding: 10 }}>{r.adminEmail}</td>
                                <td style={{ padding: 10 }}>{r.city || "-"}</td>
                                <td style={{ padding: 10 }}>{r.phone || "-"}</td>
                                <td style={{ padding: 10 }}>
                                    <span style={pill(r.status)}>{r.status}</span>
                                </td>
                                <td style={{ padding: 10 }}>
                                    {r.status === "PENDING" ? (
                                        <>
                                            <button onClick={() => doApprove(r.id)} style={{ marginRight: 8 }}>
                                                Approve
                                            </button>
                                            <button onClick={() => doReject(r.id)} style={{ color: "#b91c1c" }}>
                                                Reject
                                            </button>
                                        </>
                                    ) : (
                                        <em>—</em>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}