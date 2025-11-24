// src/pages/dashboard/VetDashboard.jsx
import React from "react";
import { useAuth } from "../../auth/AuthProvider";

export default function VetDashboard() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
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
