// src/pages/admin/AdminClinicRequests.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { listClinics, approveClinic, rejectClinic } from "../../api/admin";
import { Link } from "react-router-dom";
import "../../styles/admin-requests.css";

export default function AdminClinicRequests() {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState("PENDING");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load(s = status) {
    setLoading(true);
    setErr("");
    try {
      const data = await listClinics(s);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  async function onApprove(id) {
    if (!window.confirm("Approve this clinic request?")) return;
    try {
      await approveClinic(id);
      await load();
    } catch (e) {
      alert(e.message || "Failed to approve");
    }
  }

  async function onReject(id) {
    if (!window.confirm("Reject this clinic request? This action cannot be undone.")) return;
    try {
      await rejectClinic(id);
      await load();
    } catch (e) {
      alert(e.message || "Failed to reject");
    }
  }

  const totals = {
    pending: rows.filter((r) => r.status === "PENDING").length,
    approved: rows.filter((r) => r.status === "APPROVED").length,
    rejected: rows.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1>Super Admin</h1>
          <p className="admin-subtitle">Clinic onboarding requests</p>
        </div>
        <div className="admin-header-right">
          <Link to="/profile" className="po-btn-outline">
            Profile
          </Link>
          <button onClick={logout} className="po-logout">
            Logout
          </button>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Pending</div>
          <div className="admin-stat-value">{totals.pending}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Approved</div>
          <div className="admin-stat-value">{totals.approved}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Rejected</div>
          <div className="admin-stat-value">{totals.rejected}</div>
        </div>
      </div>

      <div className="admin-filters" style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 600 }}>Status</label>
        <div className="admin-tabs">
          {["PENDING", "APPROVED", "REJECTED"].map((s) => (
            <button
              key={s}
              className={`admin-tab ${status === s ? "active" : ""}`}
              onClick={() => setStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => load()} className="admin-btn-refresh">
            Refresh
          </button>
        </div>
      </div>

      {err && <div className="admin-error">{err}</div>}

      {loading ? (
        <div className="admin-loading">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="admin-empty">
          <p>No clinic requests found with status: {status}</p>
        </div>
      ) : (
        <div className="admin-cards-grid">
          {rows.map((r) => {
            const decisionTimestamp = r.decidedAt || r.createdAt;
            return (
              <div key={r.id} className="admin-card">
                <div className="admin-card-top">
                  <div>
                    <div className="admin-card-title">{r.name || r.clinicName}</div>
                    <div className="admin-card-meta">
                      <span className={`pill pill-${r.status.toLowerCase()}`}>{r.status}</span>
                      <span className="pill ghost">#{r.id}</span>
                    </div>
                  </div>
                  <div className="admin-card-actions">
                    {r.status === "PENDING" ? (
                      <>
                        <button onClick={() => onApprove(r.id)} className="admin-btn-approve">
                          Approve
                        </button>
                        <button onClick={() => onReject(r.id)} className="admin-btn-reject">
                          Reject
                        </button>
                      </>
                    ) : (
                      <small className="admin-card-decided">
                        {decisionTimestamp ? new Date(decisionTimestamp).toLocaleString() : "-"}
                        {r.decidedBy && ` by ${r.decidedBy}`}
                      </small>
                    )}
                  </div>
                </div>

                <div className="admin-card-body">
                  <div className="admin-field">
                    <span className="admin-field-label">Admin</span>
                    <span className="admin-field-value">
                      {r.clinicAdminEmail || r.adminEmail || "-"}
                      {r.clinicAdminId && <span className="muted"> · User #{r.clinicAdminId}</span>}
                    </span>
                  </div>
                  <div className="admin-field">
                    <span className="admin-field-label">City</span>
                    <span className="admin-field-value">{r.city || "—"}</span>
                  </div>
                  <div className="admin-field">
                    <span className="admin-field-label">Phone</span>
                    <span className="admin-field-value">{r.phone || "—"}</span>
                  </div>
                  <div className="admin-field">
                    <span className="admin-field-label">Address</span>
                    <span className="admin-field-value">{r.address || "—"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
