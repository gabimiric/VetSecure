// src/pages/clinic/StaffManagement.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../services/http";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/petowner.css";

export default function StaffManagement() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStaff = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Find clinic where this user is the admin
        const clinicsRes = await api.get("/api/admin/clinics");
        const clinics = Array.isArray(clinicsRes.data) ? clinicsRes.data : [];
        const userClinic = clinics.find(
          (c) => c.clinicAdmin?.id === user.id || c.clinicAdminId === user.id
        );

        if (!userClinic) {
          setError("No clinic found. Please register a clinic first.");
          setLoading(false);
          return;
        }

        setClinic(userClinic);

        // Load staff (vets and assistants) for this clinic
        try {
          const vetsRes = await api.get("/vets");
          const allVets = Array.isArray(vetsRes.data) ? vetsRes.data : [];
          const clinicStaff = allVets.filter(
            (v) =>
              v.clinic?.id === userClinic.id || v.clinicId === userClinic.id
          );
          setStaff(clinicStaff);
        } catch (err) {
          console.warn("Failed to load staff:", err);
          setStaff([]);
        }
      } catch (err) {
        console.error("Error loading staff:", err);
        setError("Failed to load staff information");
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="po-container">
        <div className="po-header skeleton">
          <div className="skeleton-title" />
          <div className="skeleton-sub" />
        </div>
      </div>
    );
  }

  return (
    <div className="po-container">
      <div className="po-header">
        <div className="po-header-left">
          <div>
            <h1 className="po-title">Staff Management</h1>
            <div className="po-subtitle">
              Manage veterinarians and assistants at {clinic?.name || "your clinic"}
            </div>
          </div>
        </div>
        <div className="po-header-right">
          <Link to="/dashboard" className="po-btn-outline">
            Dashboard
          </Link>
          <button onClick={logout} className="po-logout">
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="po-alert">
          {error}
          <button
            className="po-alert-action"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      )}

      {clinic && (
        <>
          <div className="po-stats">
            <div className="po-stat">
              <div className="stat-value">{staff.length}</div>
              <div className="stat-label">Total Staff</div>
            </div>
            <div className="po-stat">
              <div className="stat-value">
                {staff.filter((s) => s.role === "doctor" || s.role === "vet").length}
              </div>
              <div className="stat-label">Veterinarians</div>
            </div>
            <div className="po-stat">
              <div className="stat-value">
                {staff.filter((s) => s.role === "assistant").length}
              </div>
              <div className="stat-label">Assistants</div>
            </div>
          </div>

          <div className="po-section">
            <div className="po-section-head">
              <h2 className="section-title">Staff Members</h2>
              <div className="section-sub">
                Veterinarians and assistants working at your clinic
              </div>
            </div>

            {staff.length === 0 ? (
              <div className="po-empty">
                <h3>No staff members</h3>
                <p className="muted">
                  No veterinarians or assistants are currently assigned to your clinic.
                </p>
                <p className="muted" style={{ fontSize: "12px", marginTop: 8 }}>
                  Staff members can register and select your clinic during registration.
                </p>
              </div>
            ) : (
              <div className="po-grid">
                {staff.map((member) => (
                  <div key={member.id} className="po-card">
                    <div className="po-card-body">
                      <div className="po-card-title">
                        {member.role === "assistant" ? "" : "Dr. "}
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="po-card-meta">
                        <span>
                          <strong>Role:</strong>{" "}
                          {member.role === "doctor" || member.role === "vet"
                            ? "Veterinarian"
                            : member.role === "assistant"
                            ? "Assistant"
                            : member.role || "Staff"}
                        </span>
                        {member.license && (
                          <>
                            <span className="dot">•</span>
                            <span>
                              <strong>License:</strong> {member.license}
                            </span>
                          </>
                        )}
                      </div>
                      {member.user?.email && (
                        <div className="po-card-meta" style={{ marginTop: 8 }}>
                          <small style={{ color: "#666" }}>
                            {member.user.email}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

