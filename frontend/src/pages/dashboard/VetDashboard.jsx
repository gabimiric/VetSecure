// src/pages/dashboard/VetDashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../services/http";
import { Link } from "react-router-dom";
import "../../styles/petowner.css";

export default function VetDashboard() {
  const { user, logout } = useAuth();
  const [vet, setVet] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadVetData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Load vet profile
        try {
          const vetRes = await api.get(`/vets/${user.id}`);
          if (vetRes.data) {
            setVet(vetRes.data);
            if (vetRes.data.clinic) {
              setClinic(vetRes.data.clinic);
            } else if (vetRes.data.clinicId) {
              // Load clinic separately if needed
              try {
                const clinicRes = await api.get(
                  `/api/admin/clinics/${vetRes.data.clinicId}`
                );
                setClinic(clinicRes.data);
              } catch (err) {
                console.warn("Failed to load clinic:", err);
              }
            }
          }
        } catch (err) {
          // Try alternative endpoint
          try {
            const allVetsRes = await api.get(`/vets`);
            const allVets = Array.isArray(allVetsRes.data) ? allVetsRes.data : [];
            const userVet = allVets.find((v) => v.user?.id === user.id || v.id === user.id);
            if (userVet) {
              setVet(userVet);
              if (userVet.clinic) {
                setClinic(userVet.clinic);
              }
            }
          } catch (err2) {
            console.warn("Failed to load vet profile:", err2);
          }
        }

        // Load appointments for this clinic
        // Note: Appointment model/endpoint not yet implemented in backend
        // When available, use: api.get(`/api/appointments/clinic/${clinic.id}`)
        setAppointments([]);
      } catch (err) {
        console.error("Error loading vet data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadVetData();
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
            <h1 className="po-title">Veterinarian Dashboard</h1>
            <div className="po-subtitle">
              Welcome, Dr. {vet?.firstName || user?.username || "Vet"}
            </div>
          </div>
        </div>
        <div className="po-header-right">
          <Link to="/profile" className="po-btn-outline">
            Profile
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
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      <div className="po-stats">
        <div className="po-stat">
          <div className="stat-value">{appointments.length}</div>
          <div className="stat-label">Appointments</div>
        </div>
        <div className="po-stat">
          <div className="stat-value">{clinic ? "Active" : "None"}</div>
          <div className="stat-label">Clinic</div>
        </div>
      </div>

      {clinic && (
        <div className="po-section">
          <div className="po-section-head">
            <h2 className="section-title">My Clinic</h2>
          </div>
          <div className="po-card">
            <div className="po-card-body">
              <h3>{clinic.name}</h3>
              <div className="po-card-meta">
                <div>
                  <strong>Status:</strong> {clinic.status}
                </div>
                <div>
                  <strong>Address:</strong> {clinic.address}
                  {clinic.city && `, ${clinic.city}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="po-section">
        <div className="po-section-head">
          <h2 className="section-title">Appointments</h2>
          <div className="section-sub">
            View and manage appointments at your clinic
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="po-empty">
            <h3>No appointments</h3>
            <p className="muted">You don't have any appointments scheduled.</p>
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
