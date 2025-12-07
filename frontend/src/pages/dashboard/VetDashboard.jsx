// src/pages/dashboard/VetDashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api, setAuthToken } from "../../services/http";
import { AuthService } from "../../services/AuthService";
import { Link } from "react-router-dom";
import "../../styles/petowner.css";

export default function VetDashboard() {
  const { user, logout } = useAuth();
  const [vet, setVet] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [scheduleErrors, setScheduleErrors] = useState("");
  const [savingScheduleId, setSavingScheduleId] = useState(null);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [editDraft, setEditDraft] = useState({
    weekday: 1,
    startTime: "",
    endTime: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Ensure auth header is present for axios calls in this screen
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token") ||
      localStorage.getItem("vetsecure_id_token");
    if (token) setAuthToken(token);

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

  // Load schedules after vet profile is available
  useEffect(() => {
    const loadSchedules = async () => {
      if (!vet?.id && !user?.id) return;
      try {
        const vetId = vet?.id || user?.id;
        // Fetch without auth header to avoid 403 if token is missing scopes
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE || "http://localhost:8082"}/vet-schedules/vet/${vetId}`,
          { mode: "cors" }
        );
        if (!res.ok) throw new Error(`Failed to load schedules: ${res.status}`);
        const scheds = await res.json();
        setSchedules(scheds);
      } catch (err) {
        console.warn("Failed to load schedules:", err);
        setSchedules([]);
      }
    };
    loadSchedules();
  }, [vet?.id, user?.id]);

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
          <h2 className="section-title">My Schedule</h2>
          <div className="section-sub">
            Set your working days and hours
          </div>
        </div>

        {scheduleErrors && <div className="po-alert">{scheduleErrors}</div>}

        {schedules.length === 0 ? (
          <div className="po-empty">
            <h3>No schedules set</h3>
            <p className="muted">
              Add your working days and hours to allow appointments.
            </p>
          </div>
        ) : (
          <div className="po-grid">
            {schedules.map((s) => {
              const weekdayLabel = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][s.weekday ?? 0];
              const start = (s.startTime || "").slice(0,5);
              const end = (s.endTime || "").slice(0,5);
              const isEditing = editingScheduleId === s.id;
              return (
                <div key={s.id} className="po-card">
                  <div className="po-card-body" style={{ display: "grid", gap: 10 }}>
                    <div className="po-card-title">{weekdayLabel}</div>
                    {!isEditing && (
                      <>
                        <div className="po-card-meta">
                          <strong>{start || "--:--"} - {end || "--:--"}</strong>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            className="primary"
                            onClick={() => {
                              setEditingScheduleId(s.id);
                              setEditDraft({
                                weekday: s.weekday ?? 0,
                                startTime: (s.startTime || "").slice(0,5),
                                endTime: (s.endTime || "").slice(0,5),
                              });
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </>
                    )}
                    {isEditing && (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                          <select
                            className="tf"
                            value={editDraft.weekday}
                            onChange={(e) =>
                              setEditDraft((p) => ({
                                ...p,
                                weekday: Number(e.target.value),
                              }))
                            }
                          >
                            {[
                              { label: "Sunday", value: 0 },
                              { label: "Monday", value: 1 },
                              { label: "Tuesday", value: 2 },
                              { label: "Wednesday", value: 3 },
                              { label: "Thursday", value: 4 },
                              { label: "Friday", value: 5 },
                              { label: "Saturday", value: 6 },
                            ].map((d) => (
                              <option key={d.value} value={d.value}>
                                {d.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="time"
                            className="tf"
                            value={editDraft.startTime}
                            onChange={(e) =>
                              setEditDraft((p) => ({
                                ...p,
                                startTime: e.target.value,
                              }))
                            }
                          />
                          <input
                            type="time"
                            className="tf"
                            value={editDraft.endTime}
                            onChange={(e) =>
                              setEditDraft((p) => ({
                                ...p,
                                endTime: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            className="primary"
                            disabled={savingScheduleId === s.id}
                            onClick={async () => {
                              setScheduleErrors("");
                              if (!editDraft.startTime || !editDraft.endTime) {
                                setScheduleErrors("Start and end times are required.");
                                return;
                              }
                              if (editDraft.endTime <= editDraft.startTime) {
                                setScheduleErrors("End time must be after start time.");
                                return;
                              }
                              setSavingScheduleId(s.id);
                              try {
                                const res = await api.put(`/vet-schedules/${s.id}`, {
                                  weekday: editDraft.weekday,
                                  startTime: editDraft.startTime,
                                  endTime: editDraft.endTime,
                                });
                                setSchedules((prev) =>
                                  prev.map((item) =>
                                    item.id === s.id ? res.data : item
                                  )
                                );
                                setEditingScheduleId(null);
                              } catch (err) {
                                console.error("Failed to update schedule:", err);
                                setScheduleErrors(
                                  err.response?.data?.message ||
                                    err.message ||
                                    "Failed to update schedule"
                                );
                              } finally {
                                setSavingScheduleId(null);
                              }
                            }}
                          >
                            {savingScheduleId === s.id ? "Saving..." : "Save"}
                          </button>
                          <button
                            className="po-btn-outline"
                            onClick={() => {
                              setEditingScheduleId(null);
                              setEditDraft({ weekday: 1, startTime: "", endTime: "" });
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
