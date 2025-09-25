// src/pages/admin/AdminClinicRequests.jsx
import React, { useEffect, useState } from "react";
import { AuthService } from "../services/AuthService";
import "../styles/admin-requests.css";

export default function AdminClinicRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // id being acted on
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/admin/clinic-requests?status=PENDING", {
        headers: {
          ...AuthService.authHeader(),
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load: ${res.status}`);
      }

      const data = await res.json();
      setRequests(data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  async function setRequestStatus(id, status) {
    // Example: PUT /admin/clinic-requests/{id} with body { status: "APPROVED" }
    // If your backend uses a different route, update it here.
    setActionLoading(id);
    try {
      const res = await fetch(`/admin/clinic-requests/${id}`, {
        method: "PUT",
        headers: {
          ...AuthService.authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Failed to update: ${res.status}`);
      }

      // optimistic update
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      setError(err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  const approveRequest = (id) => setRequestStatus(id, "APPROVED");
  const rejectRequest = (id) => setRequestStatus(id, "REJECTED");

  return (
    <div className="admin-requests-screen">
      <div className="admin-requests-card">
        <div className="admin-header">
          <h2 className="admin-title">Clinic Onboarding Requests</h2>
          <p className="admin-sub">
            Review pending clinic requests and approve or reject them.
          </p>
        </div>

        {error && <div className="admin-alert err">{error}</div>}

        {loading ? (
          <div className="admin-loading">Loading requests…</div>
        ) : requests.length === 0 ? (
          <div className="admin-empty">
            <h4>No pending requests</h4>
            <p className="muted">
              You’ll see new clinic requests here as they arrive.
            </p>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map((r) => (
              <div key={r.id} className="request-card">
                <div className="request-main">
                  <div className="request-title">{r.clinicName}</div>
                  <div className="request-meta muted">
                    {r.city ? `${r.city} • ` : ""}
                    {r.address || "Address not provided"}
                  </div>
                  <div className="request-admin">
                    <div>
                      <strong>Admin:</strong> {r.adminName || "—"}
                    </div>
                    <div>
                      <strong>Email:</strong> {r.adminEmail || "—"}
                    </div>
                    <div>
                      <strong>Phone:</strong> {r.phone || "—"}
                    </div>
                  </div>
                </div>

                <div className="request-actions">
                  <button
                    className="btn-ghost"
                    onClick={() => rejectRequest(r.id)}
                    disabled={actionLoading === r.id}
                  >
                    {actionLoading === r.id ? "Working…" : "Reject"}
                  </button>
                  <button
                    className="btn-approve"
                    onClick={() => approveRequest(r.id)}
                    disabled={actionLoading === r.id}
                  >
                    {actionLoading === r.id ? "Working…" : "Approve"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
