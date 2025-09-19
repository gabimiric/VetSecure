import React, { useEffect, useState } from "react";
import { listClinicRequests, approveClinicRequest, rejectClinicRequest } from "../../api/admin";

export default function AdminClinicRequests() {
    const [status, setStatus] = useState("PENDING");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    async function load(s = status) {
        setLoading(true); setErr("");
        try {
            const data = await listClinicRequests(s);
            setRows(data);
        } catch (e) {
            setErr(e.message || "Failed to load");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

    async function onApprove(id) {
        try {
            await approveClinicRequest(id);
            await load(); // refresh
        } catch (e) { alert(e.message); }
    }

    async function onReject(id) {
        if (!window.confirm("Reject this request?")) return;
        try {
            await rejectClinicRequest(id);
            await load();
        } catch (e) { alert(e.message); }
    }

    return (
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <h2>Admin • Clinic requests</h2>

            <div style={{ marginBottom: 12 }}>
                <label>Status:&nbsp;</label>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                </select>
                <button onClick={() => load()} style={{ marginLeft: 8 }}>Refresh</button>
            </div>

            {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}
            {loading ? <div>Loading…</div> :
                rows.length === 0 ? <div>No rows</div> :
                    <table width="100%" cellPadding="6" style={{ borderCollapse: "collapse" }}>
                        <thead>
                        <tr style={{ background: "#f6f6f6" }}>
                            <th align="left">#</th>
                            <th align="left">Clinic</th>
                            <th align="left">Admin</th>
                            <th align="left">City</th>
                            <th align="left">Phone</th>
                            <th align="left">Status</th>
                            <th align="left">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map(r => (
                            <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                                <td>{r.id}</td>
                                <td>{r.clinicName}</td>
                                <td>{r.adminName} <small>({r.adminEmail})</small></td>
                                <td>{r.city || "-"}</td>
                                <td>{r.phone || "-"}</td>
                                <td>{r.status}</td>
                                <td>
                                    {r.status === "PENDING" ? (
                                        <>
                                            <button onClick={() => onApprove(r.id)}>Approve</button>
                                            <button onClick={() => onReject(r.id)} style={{ marginLeft: 8 }}>Reject</button>
                                        </>
                                    ) : <small>{r.decidedAt ? new Date(r.decidedAt).toLocaleString() : "-"}</small>}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>}
        </div>
    );
}