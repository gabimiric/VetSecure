// src/pages/clinic/AppointmentsPage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../services/http";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/petowner.css";

export default function AppointmentsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAppointments = async () => {
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

        // Load appointments for this clinic
        // Note: Appointment model/endpoint not yet implemented in backend
        // When available, use: api.get(`/api/appointments/clinic/${userClinic.id}`)
        setAppointments([]);
      } catch (err) {
        console.error("Error loading appointments:", err);
        setError("Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
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
            <h1 className="po-title">Appointments</h1>
            <div className="po-subtitle">
              View and manage appointments at {clinic?.name || "your clinic"}
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
              <div className="stat-value">{appointments.length}</div>
              <div className="stat-label">Total Appointments</div>
            </div>
            <div className="po-stat">
              <div className="stat-value">
                {appointments.filter(
                  (apt) =>
                    apt.startsAt &&
                    new Date(apt.startsAt) > new Date() &&
                    apt.status !== "CANCELLED"
                ).length}
              </div>
              <div className="stat-label">Upcoming</div>
            </div>
          </div>

          <div className="po-section">
            <div className="po-section-head">
              <h2 className="section-title">All Appointments</h2>
              <div className="section-sub">
                Scheduled appointments at your clinic
              </div>
            </div>

            {appointments.length === 0 ? (
              <div className="po-empty">
                <h3>No appointments</h3>
                <p className="muted">
                  There are no appointments scheduled at your clinic yet.
                </p>
                <p className="muted" style={{ fontSize: "12px", marginTop: 8 }}>
                  Note: Appointment functionality is not yet implemented in the backend.
                  When available, appointments will be displayed here.
                </p>
              </div>
            ) : (
              <div className="po-grid">
                {appointments.map((apt) => (
                  <div key={apt.id} className="po-card">
                    <div className="po-card-body">
                      <div className="po-card-title">
                        {apt.pet?.name || "Unknown Pet"}
                      </div>
                      <div className="po-card-meta">
                        <span>
                          {apt.startsAt
                            ? new Date(apt.startsAt).toLocaleString()
                            : "TBD"}
                        </span>
                        {apt.vet && (
                          <>
                            <span className="dot">•</span>
                            <span>
                              Dr. {apt.vet.firstName} {apt.vet.lastName}
                            </span>
                          </>
                        )}
                        {apt.status && (
                          <>
                            <span className="dot">•</span>
                            <span>
                              <strong>Status:</strong> {apt.status}
                            </span>
                          </>
                        )}
                      </div>
                      {apt.notes && (
                        <div className="po-card-meta" style={{ marginTop: 8 }}>
                          <small style={{ color: "#666" }}>{apt.notes}</small>
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

