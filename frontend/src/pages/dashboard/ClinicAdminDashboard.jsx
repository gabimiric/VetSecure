// src/pages/dashboard/ClinicAdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../services/http";
import { Link } from "react-router-dom";
import "../../styles/petowner.css";

// Two-column layout style
const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px",
  marginTop: "24px",
};

export default function ClinicAdminDashboard() {
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    // signOut() will handle navigation
  };
  const [clinic, setClinic] = useState(null);
  const [clinicRequests, setClinicRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadClinicData = async () => {
      console.log("[ClinicAdminDashboard] useEffect triggered, user:", user);

      // Don't require user.id - we can still load requests with email/username
      if (!user) {
        console.warn("[ClinicAdminDashboard] No user object, skipping load");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Always try to load clinic requests to show all requests
        let userRequests = [];
        let userRequest = null;
        try {
          console.log(
            "[ClinicAdminDashboard] ===== Fetching clinic requests ====="
          );
          console.log("[ClinicAdminDashboard] User object:", {
            id: user?.id,
            email: user?.email,
            username: user?.username,
          });

          // Check if token is set
          const token =
            localStorage.getItem("vetsecure_id_token") ||
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access_token");
          console.log("[ClinicAdminDashboard] Auth token present:", !!token);
          console.log(
            "[ClinicAdminDashboard] API base URL:",
            api.defaults.baseURL
          );
          console.log(
            "[ClinicAdminDashboard] API headers:",
            api.defaults.headers
          );
          console.log(
            "[ClinicAdminDashboard] Authorization header:",
            api.defaults.headers?.common?.Authorization
          );

          // Ensure Authorization header is set
          if (!api.defaults.headers?.common?.Authorization) {
            console.warn(
              "[ClinicAdminDashboard] No Authorization header found, setting it..."
            );
            const token =
              localStorage.getItem("vetsecure_id_token") ||
              localStorage.getItem("access_token") ||
              sessionStorage.getItem("access_token");
            if (token) {
              api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
              console.log(
                "[ClinicAdminDashboard] Manually set Authorization header"
              );
            } else {
              console.error("[ClinicAdminDashboard] ERROR: No token found!");
            }
          }

          console.log(
            "[ClinicAdminDashboard] Making API call to /api/clinic-requests/me"
          );
          const requestsRes = await api.get("/api/clinic-requests/me");

          console.log("[ClinicAdminDashboard] ===== API RESPONSE =====");
          console.log(
            "[ClinicAdminDashboard] Full Response Object:",
            requestsRes
          );
          console.log(
            "[ClinicAdminDashboard] Response Status:",
            requestsRes.status
          );
          console.log(
            "[ClinicAdminDashboard] Response Headers:",
            requestsRes.headers
          );
          console.log(
            "[ClinicAdminDashboard] Response Data:",
            requestsRes.data
          );
          console.log(
            "[ClinicAdminDashboard] Response Data Type:",
            typeof requestsRes.data
          );
          console.log(
            "[ClinicAdminDashboard] Is Array?",
            Array.isArray(requestsRes.data)
          );
          console.log(
            "[ClinicAdminDashboard] Data Length:",
            Array.isArray(requestsRes.data) ? requestsRes.data.length : "N/A"
          );

          // Handle different response formats
          if (Array.isArray(requestsRes.data)) {
            userRequests = requestsRes.data;
          } else if (requestsRes.data && Array.isArray(requestsRes.data.data)) {
            // Sometimes axios wraps it
            userRequests = requestsRes.data.data;
          } else if (requestsRes.data && requestsRes.data.items) {
            userRequests = requestsRes.data.items;
          } else {
            userRequests = [];
          }

          console.log(
            "[ClinicAdminDashboard] Final parsed requests:",
            userRequests
          );
          console.log(
            "[ClinicAdminDashboard] Number of requests:",
            userRequests.length
          );
          console.log("[ClinicAdminDashboard] User email:", user?.email);
          console.log("[ClinicAdminDashboard] User username:", user?.username);
          console.log("[ClinicAdminDashboard] ===== END API RESPONSE =====");

          // Store all requests
          // defer setting clinicRequests until we also load clinics below

          // Get the most recent pending request, or the most recent one for single display
          userRequest =
            userRequests.find((r) => r.status === "PENDING") || userRequests[0];
          if (userRequest) {
            console.log(
              "[ClinicAdminDashboard] Selected request:",
              userRequest
            );
          }
        } catch (err) {
          console.error("===== ERROR loading clinic requests =====");
          console.error("Error object:", err);
          console.error("Error message:", err.message);
          console.error("Error response:", err.response);
          console.error("Error response data:", err.response?.data);
          console.error("Error response status:", err.response?.status);
          console.error("Error response headers:", err.response?.headers);
          console.error("Request config:", err.config);
          console.error("==========================================");
          setClinicRequests([]);
          setError(
            "Failed to load clinic requests: " +
              (err.response?.data?.message || err.message || "Unknown error")
          );
        }

        // Try to find clinic where this user is the admin
        let userClinic = null;
        let myClinics = [];

        // Preferred source: clinics table linked to this admin
        try {
          const myClinicsRes = await api.get("/api/clinics/me");
          myClinics = Array.isArray(myClinicsRes.data) ? myClinicsRes.data : [];
          // Pick approved clinic first, otherwise any entry
          userClinic =
            myClinics.find((c) => c.status === "APPROVED") || myClinics[0];
        } catch (err) {
          console.warn("Failed to load clinics for current admin:", err);
        }

        // Fallback: previous admin endpoint (requires role)
        try {
          if (!userClinic) {
            const clinicsRes = await api.get("/api/admin/clinics");
            const clinics = Array.isArray(clinicsRes.data)
              ? clinicsRes.data
              : [];
            userClinic = clinics.find(
              (c) =>
                c.clinicAdmin?.id === user.id || c.clinicAdminId === user.id
            );
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

        const combinedRequests =
          clinicRequestsFromClinics.length > 0
            ? clinicRequestsFromClinics
            : userRequests;
        setClinicRequests(combinedRequests);

        if (combinedRequests.length === 0) {
          console.warn(
            "[ClinicAdminDashboard] WARNING: No requests found! Check backend logs."
          );
        }

        if (userClinic) {
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

          // Load appointments for this clinic
          // Note: Appointment model/endpoint not yet implemented in backend
          // When available, use: api.get(`/api/appointments/clinic/${userClinic.id}`)
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
          <button onClick={handleLogout} className="po-logout">
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

      {clinic ? (
        <>
          {/* Display all clinic requests */}
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
              </div>
            </div>
          </div>

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
                          Your clinic request is pending approval by a platform
                          admin. You'll be notified once a decision is made.
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
                          Your clinic request has been rejected. Please contact
                          support for more information.
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
              <Link to="/register/clinic" className="po-btn-outline margin-top">
                Register New Clinic
              </Link>
            </div>

            {/* Debug info - remove in production */}
            {/* {process.env.NODE_ENV === "development" && (
              <div
                style={{
                  padding: "12px",
                  background: "#f0f0f0",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                }}
              >
                <strong>Debug Info:</strong>
                <br />
                clinicRequests.length = {clinicRequests.length}
                <br />
                User ID: {user?.id}
                <br />
                User email: {user?.email}
                <br />
                User username: {user?.username || "NOT SET"}
                <br />
                Loading: {loading ? "true" : "false"}
                <br />
                Error: {error || "none"}
                <br />
                <strong>Requests Array:</strong>
                <pre
                  style={{
                    fontSize: "10px",
                    overflow: "auto",
                    maxHeight: "200px",
                  }}
                >
                  {JSON.stringify(clinicRequests, null, 2)}
                </pre>
              </div>
            )} */}

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
