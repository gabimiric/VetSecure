// src/pages/dashboard/VetDashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api, setAuthToken } from "../../services/http";
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
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

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
    // removed unauthenticated vet-schedules request to avoid 401s.
  }, [vet?.id, user?.id]);

  // Fetch appointments for current vet
  async function loadAppointmentsForVet(vetId) {
    if (!vetId) return;
    try {
      setLoading(true);
      // correct backend path: use the /api/appointments/vet/{id} endpoint
      const res = await api.get(`/api/appointments/vet/${vetId}`);
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  // call loader when vet is set
  useEffect(() => {
    if (vet?.id) loadAppointmentsForVet(vet.id);
  }, [vet?.id]);

  // open appointment details (loads fresh data)
  async function openAppointmentDetails(id) {
    console.log("openAppointmentDetails -> id:", id);
    setDetailError(null);
    try {
      setDetailLoading(true);
      // use API-prefixed path (ensure `api` client is configured)
      const res = await api.get(`/api/appointments/${id}`);
      console.log("appointment details response:", res);
      setSelectedAppointment(res.data);

      // Fetch full pet record by pet id from the appointment (use DB canonical pet data)
      const petId = res?.data?.pet?.id;
      if (petId) {
        try {
          const petRes = await api.get(`/api/pets/${petId}`);
          if (petRes?.data) {
            setSelectedAppointment(prev => ({ ...(prev || {}), pet: petRes.data }));
          }
        } catch (petErr) {
          console.warn("Failed to load pet record for appointment:", petErr);
          // continue showing appointment data already returned
        }
      }
    } catch (err) {
      console.error("Failed to load appointment details:", err);
      setDetailError(err?.response?.data?.error || err.message || "Failed to load appointment");
      alert(`Failed to load appointment: ${err?.response?.status || ""} ${err?.message || ""}`);
    } finally {
      setDetailLoading(false);
    }
  }

  // update fields locally
  function updateDetailField(field, value) {
    setSelectedAppointment((p) => (p ? { ...p, [field]: value } : p));
  }

  // save appointment (diagnosis/prescription/status)
  async function saveAppointment() {
    if (!selectedAppointment?.id) return;
    setDetailLoading(true);
    setDetailError(null);

    const payload = {
      diagnosis: selectedAppointment.diagnosis ?? null,
      prescription: selectedAppointment.prescription ?? null,
      status: selectedAppointment.status ?? null,
    };

    try {
      const res = await api.put(`/api/appointments/${selectedAppointment.id}`, payload);

      if (res && res.status >= 200 && res.status < 300) {
        const updated = res.data;
        setSelectedAppointment((prev) => ({ ...(prev || {}), ...(updated || {}) }));
        setAppointments((prev) =>
          (prev || []).map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
        );
        setDetailError(null);
        return;
      }

      // unexpected non-2xx -> try to refresh appointment to confirm state
      try {
        const ref = await api.get(`/api/appointments/${selectedAppointment.id}`);
        const updated = ref.data;
        setSelectedAppointment((prev) => ({ ...(prev || {}), ...(updated || {}) }));
        setAppointments((prev) =>
          (prev || []).map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
        );
        setDetailError(null);
      } catch (refreshErr) {
        setDetailError(`Unexpected response ${res?.status || "?"}`);
      }
    } catch (err) {
      // If save errored, attempt a follow-up GET — if GET succeeds treat as saved and clear error.
      try {
        console.warn("Save failed, attempting to refresh appointment:", err);
        const ref = await api.get(`/api/appointments/${selectedAppointment.id}`);
        const updated = ref.data;
        setSelectedAppointment((prev) => ({ ...(prev || {}), ...(updated || {}) }));
        setAppointments((prev) =>
          (prev || []).map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
        );
        setDetailError(null);
      } catch (refreshErr) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save appointment";
        setDetailError(msg);
      }
    } finally {
      setDetailLoading(false);
    }
  }

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
    <>
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
                    <div className="po-card-title">{apt.pet?.name || "Unknown Pet"}</div>
                    <div className="po-card-meta">
                      <span>
                        {apt.startsAt ? new Date(apt.startsAt).toLocaleString() : `${apt.date} ${apt.time}`}
                      </span>
                      <span className="muted" style={{ marginLeft: 8 }}>{apt.status}</span>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {/* ensure button does not act as a form submit */}
                      <button type="button" className="btn" onClick={() => openAppointmentDetails(apt.id)}>
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointment details modal (in-page) */}
        {selectedAppointment && (
          <div className="modal-backdrop">
            <div className="modal">
              <div className="modal-head">
                <h3>Appointment #{selectedAppointment.id}</h3>
                <button className="btn-ghost" onClick={() => setSelectedAppointment(null)}>Close</button>
              </div>

              {detailLoading ? (
                <div>Loading...</div>
              ) : detailError ? (
                <div className="error">{detailError}</div>
              ) : (
                <div className="modal-body">
                  <section>
                    <h4>Appointment</h4>
                    <div><strong>Date:</strong> {selectedAppointment.date}</div>
                    <div><strong>Time:</strong> {selectedAppointment.time}</div>
                    <div><strong>Reason:</strong> {selectedAppointment.reason || "—"}</div>
                    <div style={{ marginTop: 8 }}>
                      <label><strong>Status</strong></label>
                      <select
                        value={selectedAppointment.status}
                        onChange={(e) => updateDetailField("status", e.target.value)}
                        className="tf"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                  </section>

                  <section style={{ marginTop: 12 }}>
                    <h4>Pet</h4>
                    {selectedAppointment.pet ? (
                      <div className="pet-details">
                        {/* show all known pet fields; adjust keys if your model differs */}
                        <div><strong>Name:</strong> {selectedAppointment.pet.name}</div>
                        <div><strong>Species:</strong> {selectedAppointment.pet.species || "—"}</div>
                        <div><strong>Breed:</strong> {selectedAppointment.pet.breed || "—"}</div>
                        <div><strong>Sex:</strong> {selectedAppointment.pet.sex || "—"}</div>
                        <div><strong>Age:</strong> {selectedAppointment.pet.age || "—"}</div>
                        <div><strong>Microchip:</strong> {selectedAppointment.pet.microchip || "—"}</div>
                      </div>
                    ) : (
                      <div>No pet data available</div>
                    )}
                  </section>

                  <section style={{ marginTop: 12 }}>
                    <h4>Diagnosis</h4>
                    <textarea
                      className="tf"
                      rows="4"
                      value={selectedAppointment.diagnosis || ""}
                      onChange={(e) => updateDetailField("diagnosis", e.target.value)}
                    />

                    <h4 style={{ marginTop: 8 }}>Prescription</h4>
                    <textarea
                      className="tf"
                      rows="4"
                      value={selectedAppointment.prescription || ""}
                      onChange={(e) => updateDetailField("prescription", e.target.value)}
                    />
                  </section>

                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <button className="btn" onClick={saveAppointment} disabled={detailLoading}>
                      Save
                    </button>
                    <button className="btn-ghost" onClick={() => setSelectedAppointment(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
