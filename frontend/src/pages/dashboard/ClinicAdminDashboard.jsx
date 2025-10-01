// src/pages/dashboard/ClinicAdminDashboard.jsx
import React from "react";
import { AuthService } from "../../services/AuthService";
import { useNavigate } from "react-router-dom";

export default function ClinicAdminDashboard() {
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();

  const handleLogout = () => {
    AuthService.logout();
    navigate("/login");
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
