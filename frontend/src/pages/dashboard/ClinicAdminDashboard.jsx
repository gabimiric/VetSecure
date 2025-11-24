// src/pages/dashboard/ClinicAdminDashboard.jsx
import React from "react";
import { useAuth } from "../../auth/AuthProvider";

export default function ClinicAdminDashboard() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Clinic Admin Dashboard</h1>
          <p className="text-muted">Welcome, {user?.username || "Admin"}</p>
        </div>
        <button onClick={handleLogout} className="btn btn-outline-secondary">
          Logout
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <h5>Clinic Management</h5>
          <p>This section will contain clinic management features.</p>
          <div className="alert alert-info">
            Clinic admin functionality coming soon...
          </div>
        </div>
      </div>
    </div>
  );
}
