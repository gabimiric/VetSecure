// src/pages/dashboard/VetDashboard.jsx
import React from "react";
import { AuthService } from "../../services/AuthService";
import { useNavigate } from "react-router-dom";

export default function VetDashboard() {
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
          <h1>Veterinarian Dashboard</h1>
          <p className="text-muted">Welcome, Dr. {user?.username || "Vet"}</p>
        </div>
        <button onClick={handleLogout} className="btn btn-outline-secondary">
          Logout
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <h5>Patient Management</h5>
          <p>This section will contain patient records and appointments.</p>
          <div className="alert alert-info">
            Veterinarian functionality coming soon...
          </div>
        </div>
      </div>
    </div>
  );
}
