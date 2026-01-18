// src/pages/dashboard/ClinicAdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../services/http";
import { postClinicRequest } from "../../api/client";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/petowner.css";
import client from "../../api/client";

// Two-column layout style
const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px",
  marginTop: "24px",
};

export default function ClinicAdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [clinic, setClinic] = React.useState(null);
  const [schedules, setSchedules] = React.useState([]);
  const [clinicRequests, setClinicRequests] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [staff, setStaff] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // schedule editing state
  const [editingScheduleIndex, setEditingScheduleIndex] = useState(null);
  const [scheduleDraft, setScheduleDraft] = useState({ weekday: 1, openTime: "09:00", closeTime: "17:00" });
  const [savingSchedules, setSavingSchedules] = useState(false);
  const [schedulesError, setSchedulesError] = useState(null);

  // DEBUG: log user to confirm role/flags
  React.useEffect(() => {
    console.log("DEBUG ClinicAdminDashboard user:", user);
  }, [user]);

  // detect clinic-admin role robustly (support either single role string or roles array)
  const isClinicAdmin = React.useMemo(() => {
    if (!user) return false;
    // adjust these to whatever your backend returns: role / roles / authorities / isClinicAdmin
    if (user.role) return user.role === "CLINIC_ADMIN" || user.role === "ROLE_CLINIC_ADMIN";
    if (Array.isArray(user.roles)) return user.roles.includes("CLINIC_ADMIN") || user.roles.includes("ROLE_CLINIC_ADMIN");
    if (Array.isArray(user.authorities)) return user.authorities.some(a => a.authority?.includes('CLINIC_ADMIN') || a === 'SCOPE_CLINIC_ADMIN');
    return !!user.isClinicAdmin;
  }, [user]);

  const handleLogout = () => {
    signOut();
  };

  useEffect(() => {
    const loadClinicData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // load clinic requests (kept as-is)
        let userRequests = [];
        let userRequest = null;
        try {
          const requestsRes = await api.get("/api/clinic-requests/me");
          if (Array.isArray(requestsRes.data)) userRequests = requestsRes.data;
          else if (requestsRes.data?.data) userRequests = requestsRes.data.data;
          else if (requestsRes.data?.items) userRequests = requestsRes.data.items;
          else userRequests = [];
          userRequest = userRequests.find((r) => r.status === "PENDING") || userRequests[0];
        } catch (err) {
          console.warn("Failed to load clinic requests:", err);
          userRequests = [];
        }

        // Try to find clinic where this user is the admin
        let userClinic = null;
        let myClinics = [];

        try {
          const myClinicsRes = await api.get("/api/clinics/me");
          myClinics = Array.isArray(myClinicsRes.data) ? myClinicsRes.data : [];
          userClinic = myClinics.find((c) => c.status === "APPROVED") || myClinics[0];
        } catch (err) {
          console.warn("Failed to load clinics for current admin:", err);
        }

        try {
          if (!userClinic) {
            const clinicsRes = await api.get("/api/admin/clinics");
            const clinics = Array.isArray(clinicsRes.data) ? clinicsRes.data : [];
            userClinic = clinics.find((c) => c.clinicAdmin?.id === user.id || c.clinicAdminId === user.id);
            myClinics = clinics;
          }
        } catch (err) {
          console.warn("Failed to load clinics:", err);
        }

        const clinicRequestsFromClinics = myClinics.map((c) => ({
          ...c,
          clinicName: c.name,
          adminEmail: c.clinicAdminEmail,
          decidedAt: c.createdAt,
          decidedBy: c.clinicAdminEmail,
        }));
        const combinedRequests = clinicRequestsFromClinics.length > 0 ? clinicRequestsFromClinics : userRequests;

        const ownerFilteredRequests = combinedRequests.filter((r) => {
          if (!user) return false;
          return (
            r.clinicAdminId === user.id ||
            r.clinicAdmin?.id === user.id ||
            r.adminEmail === user.email ||
            r.adminEmail === user.username
          );
        });

        setClinicRequests(ownerFilteredRequests);

        if (userClinic) {
          setClinic(userClinic);

          // Load staff (vets) for this clinic
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

          // Load appointments (kept empty if backend not present)
          setAppointments([]);
        }
      } catch (err) {
        console.error("Error loading clinic data:", err);
        setError("Failed to load clinic information");
      } finally {
        setLoading(false);
      }
    };

    loadClinicData();
  }, [user]);

  // load clinic and schedules with separate client (retains behavior)
  useEffect(() => {
    async function loadClinic() {
      setLoading(true);
      try {
        if (!client.defaults.headers?.common?.Authorization) {
          const t =
            localStorage.getItem("vetsecure_id_token") ||
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access_token");
          if (t) client.defaults.headers.common["Authorization"] = `Bearer ${t}`;
        }

        const res = await client.get("/api/clinics/me");
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        setClinic(data);
        if (data && data.id) {
          try {
            const sres = await client.get(`/api/clinics/${data.id}/schedules`);
            setSchedules(Array.isArray(sres.data) ? sres.data : []);
          } catch (e) {
            console.warn("ClinicAdminDashboard: schedule fetch failed", e);
            setSchedules([]);
          }
        }
      } catch (e) {
        console.error("ClinicAdminDashboard: load error", e);
        setError(e);
      } finally {
        setLoading(false);
      }
    }
    loadClinic();
  }, [user]);

  const formatError = (e) => {
    if (!e) return null;
    if (typeof e === "string") return e;
    if (e?.message) return e.message;
    try { return JSON.stringify(e); } catch { return String(e); }
  };

  // SCHEDULE UI / CRUD helpers
  function startEditSchedule(index) {
    const s = schedules[index] || { weekday: 1, openTime: "09:00", closeTime: "17:00" };
    setEditingScheduleIndex(index);
    setScheduleDraft({
      weekday: Number(s.weekday || 1),
      openTime: s.openTime || s.startTime || "09:00",
      closeTime: s.closeTime || s.endTime || "17:00",
    });
    setSchedulesError(null);
  }

  function cancelEditSchedule() {
    setEditingScheduleIndex(null);
    setScheduleDraft({ weekday: 1, openTime: "09:00", closeTime: "17:00" });
    setSchedulesError(null);
  }

  function updateScheduleDraft(field, value) {
    setScheduleDraft(d => ({ ...d, [field]: value }));
  }

  function addScheduleRow() {
    setSchedules(s => [...(s || []), { id: `tmp-${Date.now()}`, weekday: Number(scheduleDraft.weekday || 1), openTime: scheduleDraft.openTime, closeTime: scheduleDraft.closeTime }]);
    // reset draft
    setScheduleDraft({ weekday: 1, openTime: "09:00", closeTime: "17:00" });
  }

  function updateScheduleRow(index) {
    setSchedules(s => (s || []).map((it, i) => i === index ? { ...it, weekday: Number(scheduleDraft.weekday), openTime: scheduleDraft.openTime, closeTime: scheduleDraft.closeTime } : it));
    cancelEditSchedule();
  }

  function removeScheduleRow(index) {
    if (typeof window === "undefined" || !window.confirm("Remove this schedule?")) return;
    setSchedules(s => (s || []).filter((_, i) => i !== index));
  }

  async function saveSchedules() {
    if (!clinic?.id) {
      setSchedulesError("No clinic selected");
      return;
    }
    setSavingSchedules(true);
    setSchedulesError(null);

    try {
      // Normalize payload to backend ScheduleDto expected by admin replace endpoint
      const payload = (schedules || []).map((s) => ({
        weekday: Number(s.weekday || s.day || 1),
        openTime: s.openTime || s.startTime || s.open || null,
        closeTime: s.closeTime || s.endTime || s.close || null,
      }));

      // Use the admin replace endpoint (server deletes existing and saves the new list)
      // Backend controller: AdminClinicController.replaceSchedules -> /api/admin/clinics/{id}/schedules
      const res = await api.put(`/api/admin/clinics/${clinic.id}/schedules`, payload);

      // refresh from server source-of-truth (server returns saved schedules)
      const fresh = await api.get(`/api/clinics/${clinic.id}/schedules`);
      setSchedules(Array.isArray(fresh.data) ? fresh.data : (Array.isArray(res.data) ? res.data : payload));
      setSchedulesError(null);
      alert("Schedules saved");
    } catch (err) {
      console.error("Failed to save schedules:", err);
      setSchedulesError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to save schedules"
      );
    } finally {
      setSavingSchedules(false);
      cancelEditSchedule();
    }
  }

  function renderSchedules() {
    if (!clinic) return null;
    if (!schedules || schedules.length === 0) {
      return (
        <div>
          <div style={{color:"#6b7280"}}>No schedule defined.</div>
          <div style={{ marginTop: 8 }}>
            <small>Add a schedule below and click "Save schedules".</small>
          </div>
        </div>
      );
    }
    const weekdayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    return (
      <div style={{ borderRadius:8, padding:12, background:"#fff", boxShadow:"0 6px 18px rgba(0,0,0,0.04)" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"#f8fafc" }}>
              <th style={{ textAlign:"left", padding:8 }}>Day</th>
              <th style={{ textAlign:"left", padding:8 }}>Open</th>
              <th style={{ textAlign:"left", padding:8 }}>Close</th>
              <th style={{ textAlign:"right", padding:8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.slice().sort((a,b)=> (Number(a.weekday||1))-(Number(b.weekday||1))).map((s, idx) => (
              <tr key={s.id || `r-${idx}`}>
                <td style={{ padding:8 }}>
                  {weekdayNames[(Number(s.weekday||1)-1 + 7) % 7] || `Day ${s.weekday}`}
                </td>
                <td style={{ padding:8 }}>{(s.openTime||s.startTime||"")?.toString?.().slice?.(0,5) ?? s.openTime}</td>
                <td style={{ padding:8 }}>{(s.closeTime||s.endTime||"")?.toString?.().slice?.(0,5) ?? s.closeTime}</td>
                <td style={{ padding:8, textAlign:"right" }}>
                  <button className="po-btn-outline" onClick={() => startEditSchedule(idx)} style={{ marginRight: 8 }}>
                    Edit
                  </button>
                  <button className="po-btn-outline" onClick={() => removeScheduleRow(idx)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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
    <div className="po-container">
      <div className="po-header">
        <div className="po-header-left">
          <div>
            <h1 className="po-title">Clinic Admin Dashboard</h1>
            <div className="po-subtitle">
              Welcome, {user?.username || "Admin"}
            </div>
          </div>
        </div>
        <div className="po-header-right">
          <Link to="/profile" className="po-btn-outline">
            Profile
          </Link>

          {isClinicAdmin && (
            <button
              className="po-btn-outline"
              onClick={() => setShowRequestForm(true)}
              style={{ marginRight: 8 }}
            >
              Register Clinic
            </button>
          )}

          <button onClick={handleLogout} className="po-logout">
            Logout
          </button>
        </div>
      </div>

      {showRequestForm && (
        <div style={{ marginTop: 12 }}>
          <ClinicRequestForm
            onCreated={(saved) => {
              setClinicRequests((prev) => [saved, ...(prev || [])]);
              if (saved?.clinic) setClinic(saved.clinic);
              setShowRequestForm(false);
            }}
            onCancel={() => setShowRequestForm(false)}
          />
        </div>
      )}

      {error && (
        <div className="po-alert">
          {formatError(error)}
          <button
            className="po-alert-action"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {clinic ? (
        <>
          {clinicRequests.length > 0 && (
            <div className="po-section">
              <div className="po-section-head">
                <h2 className="section-title">My Clinic Requests</h2>
                <div className="section-sub">
                  All clinic registration requests you've submitted
                </div>
              </div>
              <div className="po-grid">
                {clinicRequests.map((req) => {
                  const clinicName = req.clinicName || req.name || "Clinic";
                  const decidedAt = req.decidedAt || req.createdAt;
                  const statusColor =
                    req.status === "PENDING"
                      ? "#ffa500"
                      : req.status === "APPROVED"
                      ? "#28a745"
                      : "#dc3545";
                  return (
                    <div
                      key={req.id}
                      className="po-card"
                      style={{
                        border: `2px solid ${statusColor}`,
                        borderLeft: `4px solid ${statusColor}`,
                      }}
                    >
                      <div className="po-card-body">
                        <div className="po-card-title">{clinicName}</div>
                        <div className="po-card-meta">
                          <div>
                            <strong>Status:</strong>{" "}
                            <span
                              style={{ color: statusColor, fontWeight: "bold" }}
                            >
                              {req.status}
                            </span>
                          </div>
                          <div>
                            <strong>Address:</strong> {req.address}
                            {req.city && `, ${req.city}`}
                          </div>
                          {req.phone && (
                            <div>
                              <strong>Phone:</strong> {req.phone}
                            </div>
                          )}
                          {decidedAt && (
                            <div>
                              <strong>Decided:</strong>{" "}
                              {new Date(decidedAt).toLocaleString()}
                              {req.decidedBy && ` by ${req.decidedBy}`}
                            </div>
                          )}
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: "12px",
                              color: "#666",
                            }}
                          >
                            <strong>Request ID:</strong> #{req.id}
                          </div>
                        </div>
                        {req.status === "PENDING" && (
                          <p
                            style={{
                              marginTop: 12,
                              color: "#666",
                              fontSize: "14px",
                            }}
                          >
                            Your clinic request is pending approval by a
                            platform admin.
                          </p>
                        )}
                        {req.status === "APPROVED" && (
                          <p
                            style={{
                              marginTop: 12,
                              color: "#28a745",
                              fontSize: "14px",
                            }}
                          >
                            ✓ Your clinic request has been approved!
                          </p>
                        )}
                        {req.status === "REJECTED" && (
                          <p
                            style={{
                              marginTop: 12,
                              color: "#dc3545",
                              fontSize: "14px",
                            }}
                          >
                            Your clinic request has been rejected.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="po-stats">
            <div className="po-stat">
              <div className="stat-value">{staff.length}</div>
              <div className="stat-label">Staff Members</div>
            </div>
            <div className="po-stat">
              <div className="stat-value">{appointments.length}</div>
              <div className="stat-label">Appointments</div>
            </div>
            <div className="po-stat">
              <div className="stat-value">{clinic.status}</div>
              <div className="stat-label">Clinic Status</div>
            </div>
          </div>

          <div className="po-section">
            <div className="po-section-head">
              <h2 className="section-title">My Clinic</h2>
              <div className="section-sub">Clinic profile and schedules</div>
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
                  {clinic.phone && (
                    <div>
                      <strong>Phone:</strong> {clinic.phone}
                    </div>
                  )}
                  {clinic.email && (
                    <div>
                      <strong>Email:</strong> {clinic.email}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 12 }}>
                  <h4>Schedules</h4>
                  {schedulesError && <div className="error">{schedulesError}</div>}
                  {renderSchedules()}

                  {/* Edit form area */}
                  <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                    <select value={scheduleDraft.weekday} onChange={(e) => updateScheduleDraft("weekday", Number(e.target.value))}>
                      {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][n-1]}</option>)}
                    </select>
                    <input type="time" value={scheduleDraft.openTime} onChange={(e) => updateScheduleDraft("openTime", e.target.value)} />
                    <input type="time" value={scheduleDraft.closeTime} onChange={(e) => updateScheduleDraft("closeTime", e.target.value)} />
                    {editingScheduleIndex === null ? (
                      <button className="btn" onClick={addScheduleRow}>Add row</button>
                    ) : (
                      <>
                        <button className="btn" onClick={() => updateScheduleRow(editingScheduleIndex)}>Update row</button>
                        <button className="btn-ghost" onClick={cancelEditSchedule}>Cancel</button>
                      </>
                    )}
                    <div style={{ marginLeft: "auto" }}>
                      <button className="btn" onClick={saveSchedules} disabled={savingSchedules}>{savingSchedules ? "Saving…" : "Save schedules"}</button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Staff, appointments, other sections remain unchanged */}
          <div className="po-section">
            <div className="po-section-head">
              <h2 className="section-title">Staff Members</h2>
              <div className="section-sub">
                Veterinarians and assistants working at your clinic
              </div>
              <div style={{ marginTop: 18 }}>
              <Link
                to="/clinic/staff"
                className="po-btn-outline"
              >
                View All Staff →
              </Link>
              </div>
            </div>

            {staff.length === 0 ? (
              <div className="po-empty">
                <h3>No staff members</h3>
                <p className="muted">
                  No veterinarians or assistants are currently assigned to your
                  clinic.
                </p>
              </div>
            ) : (
              <div className="po-grid">
                {staff.map((member) => (
                  <div key={member.id} className="po-card">
                    <div className="po-card-body">
                      <div className="po-card-title">
                        Dr. {member.firstName} {member.lastName}
                      </div>
                      <div className="po-card-meta">
                        <span>
                          <strong>Role:</strong> {member.role || "Veterinarian"}
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

          <div className="po-section">
            <div className="po-section-head">
              <h2 className="section-title">Appointments</h2>
              <div className="section-sub">
                All appointments scheduled at your clinic
              </div>
              <div style={{ marginTop: 18 }}>
              <Link
                to="/clinic/appointments"
                className="po-btn-outline"
              >
                View All Appointments →
              </Link>
              </div>
            </div>

            {appointments.length === 0 ? (
              <div className="po-empty">
                <h3>No appointments</h3>
                <p className="muted">
                  There are no appointments scheduled at your clinic yet.
                </p>
                <p className="muted" style={{ fontSize: "12px", marginTop: 8 }}>
                  Note: Appointment functionality is not yet implemented in the
                  backend.
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : clinicRequests.length > 0 ? (
        <>
          <div className="po-section">
            <div className="po-section-head">
              <h2 className="section-title">My Clinic Requests</h2>
              <div className="section-sub">
                All clinic registration requests you've submitted
              </div>
            </div>
            <div className="po-grid">
              {clinicRequests.map((req) => {
                const clinicName = req.clinicName || req.name || "Clinic";
                const decidedAt = req.decidedAt || req.createdAt;
                const statusColor =
                  req.status === "PENDING"
                    ? "#ffa500"
                    : req.status === "APPROVED"
                    ? "#28a745"
                    : "#dc3545";
                return (
                  <div
                    key={req.id}
                    className="po-card"
                    style={{
                      border: `2px solid ${statusColor}`,
                      borderLeft: `4px solid ${statusColor}`,
                    }}
                  >
                    <div className="po-card-body">
                      <div className="po-card-title">{clinicName}</div>
                      <div className="po-card-meta">
                        <div>
                          <strong>Status:</strong>{" "}
                          <span
                            style={{ color: statusColor, fontWeight: "bold" }}
                          >
                            {req.status}
                          </span>
                        </div>
                        <div>
                          <strong>Address:</strong> {req.address}
                          {req.city && `, ${req.city}`}
                        </div>
                        {req.phone && (
                          <div>
                            <strong>Phone:</strong> {req.phone}
                          </div>
                        )}
                        {decidedAt && (
                          <div>
                            <strong>Decided:</strong> {" "}
                            {new Date(decidedAt).toLocaleString()}
                            {req.decidedBy && ` by ${req.decidedBy}`}
                          </div>
                        )}
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          <strong>Request ID:</strong> #{req.id}
                        </div>
                      </div>
                      {req.status === "PENDING" && (
                        <p
                          style={{
                            marginTop: 12,
                            color: "#666",
                            fontSize: "14px",
                          }}
                        >
                          Your clinic request is pending approval by a
                          platform admin. You'll be notified once a decision
                          is made.
                        </p>
                      )}
                      {req.status === "APPROVED" && (
                        <p
                          style={{
                            marginTop: 12,
                            color: "#28a745",
                            fontSize: "14px",
                          }}
                        >
                          ✓ Your clinic request has been approved! Your clinic
                          should now be visible in the system.
                        </p>
                      )}
                      {req.status === "REJECTED" && (
                        <p
                          style={{
                            marginTop: 12,
                            color: "#dc3545",
                            fontSize: "14px",
                          }}
                        >
                          Your clinic request has been rejected. Please
                          contact support for more information.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </>
      ) : (
        <div style={twoColumnStyle} className="two-column-dashboard">
          {/* Left Column: Clinics */}
          <div className="po-section">
            <div className="po-section-head">
              <h2 className="section-title">My Clinics</h2>
              <div className="section-sub">Clinics you manage</div>
            </div>
            <div className="po-empty">
              <h3>No clinics yet</h3>
              <p className="muted">
                You haven't created any clinics yet. Once your clinic request is
                approved, it will appear here.
              </p>
            </div>
          </div>

          {/* Right Column: Clinic Requests */}
          <div className="po-section">
            <div className="po-section-head">
              <h2 className="section-title">Clinic Requests</h2>
              <div className="section-sub">
                Your clinic registration requests
              </div>
            </div>

            {clinicRequests.length > 0 ? (
              <div className="po-grid">
                {clinicRequests.map((req) => {
                  const clinicName = req.clinicName || req.name || "Clinic";
                  const decidedAt = req.decidedAt || req.createdAt;
                  const statusColor =
                    req.status === "PENDING"
                      ? "#ffa500"
                      : req.status === "APPROVED"
                      ? "#28a745"
                      : "#dc3545";
                  return (
                    <div
                      key={req.id}
                      className="po-card"
                      style={{
                        border: `2px solid ${statusColor}`,
                        borderLeft: `4px solid ${statusColor}`,
                      }}
                    >
                      <div className="po-card-body">
                        <div className="po-card-title">{clinicName}</div>
                        <div className="po-card-meta">
                          <div>
                            <strong>Status:</strong>{" "}
                            <span
                              style={{ color: statusColor, fontWeight: "bold" }}
                            >
                              {req.status}
                            </span>
                          </div>
                          <div>
                            <strong>Address:</strong> {req.address}
                            {req.city && `, ${req.city}`}
                          </div>
                          {req.phone && (
                            <div>
                              <strong>Phone:</strong> {req.phone}
                            </div>
                          )}
                          {decidedAt && (
                            <div>
                              <strong>Decided:</strong>{" "}
                              {new Date(decidedAt).toLocaleString()}
                              {req.decidedBy && ` by ${req.decidedBy}`}
                            </div>
                          )}
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: "12px",
                              color: "#666",
                            }}
                          >
                            <strong>Request ID:</strong> #{req.id}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="po-empty">
                <h3>No requests yet</h3>
                <p className="muted">
                  You haven't submitted any clinic requests yet. Click the
                  button above to register your first clinic.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ClinicRequestForm({ onCreated, onCancel }) {
  const { user } = useAuth();
  const [clinicName, setClinicName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [adminName, setAdminName] = React.useState("");
  const [adminEmail, setAdminEmail] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // schedules for registration request
  const [schedules, setSchedules] = React.useState([]);
  const [scheduleDraft, setScheduleDraft] = React.useState({ weekday: 1, openTime: "09:00", closeTime: "17:00" });

  React.useEffect(() => {
    if (user) {
      setAdminEmail(user.email || user.username || "");
      setAdminName(user.name || user.username || "");
    }
  }, [user]);

  function addSchedule() {
    setSchedules(s => [...s, { weekday: Number(scheduleDraft.weekday), openTime: scheduleDraft.openTime, closeTime: scheduleDraft.closeTime }]);
    setScheduleDraft({ weekday: 1, openTime: "09:00", closeTime: "17:00" });
  }

  function removeSchedule(i) {
    setSchedules(s => s.filter((_, idx) => idx !== i));
  }

  const submit = async () => {
    if (!clinicName) { alert("Clinic name required"); return; }
    setSaving(true);
    try {
      const payload = {
        clinicName,
        address,
        city,
        phone,
        adminName,
        adminEmail: adminEmail || (user?.email || user?.username),
        schedules, // include schedules with the request
      };

      const res = await postClinicRequest(payload);
      const saved = res;
      onCreated && onCreated(saved);

      setClinicName("");
      setAddress("");
      setCity("");
      setPhone("");
      setAdminName(user?.name || "");
      setAdminEmail(user?.email || user?.username || "");
      setSchedules([]);
      alert(`Clinic request submitted (id: ${saved?.id || "?"})`);
    } catch (err) {
      console.error("Failed to create clinic request:", err);
      alert(err.response?.data?.message || err.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="po-card">
      <div className="po-card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>Create Clinic Request</h3>
          <div>
            <button className="po-btn-outline" onClick={onCancel} style={{ marginRight: 8 }}>
              Cancel
            </button>
          </div>
        </div>

        <input
          className="tf"
          placeholder="Clinic name"
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
        />
        <input
          className="tf"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          className="tf"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          className="tf"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="tf"
          placeholder="Admin name"
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
        />
        <input
          className="tf"
          placeholder="Admin email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
        />

        <div style={{ marginTop: 12 }}>
          <h4>Schedules (optional)</h4>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <select value={scheduleDraft.weekday} onChange={(e) => setScheduleDraft(d => ({ ...d, weekday: Number(e.target.value) }))}>
              {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][n-1]}</option>)}
            </select>
            <input type="time" value={scheduleDraft.openTime} onChange={(e) => setScheduleDraft(d => ({ ...d, openTime: e.target.value }))} />
            <input type="time" value={scheduleDraft.closeTime} onChange={(e) => setScheduleDraft(d => ({ ...d, closeTime: e.target.value }))} />
            <button type="button" onClick={addSchedule} className="btn">Add</button>
          </div>

          <ul>
            {schedules.map((s, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][(s.weekday||1)-1]} {s.openTime} - {s.closeTime}
                <button type="button" className="po-btn-outline" style={{ marginLeft: 8 }} onClick={() => removeSchedule(i)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="primary" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Submit Request"}
          </button>
          <button className="po-btn-outline" onClick={onCancel} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export { ClinicRequestForm };
