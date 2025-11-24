// src/pages/dashboard/AssistantDashboard.jsx
import React from "react";
import { useAuth } from "../../auth/AuthProvider";

export default function AssistantDashboard() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Assistant Dashboard</h1>
          <p className="text-muted">Welcome, {user?.username || "Assistant"}</p>
        </div>
        <button onClick={handleLogout} className="btn btn-outline-secondary">
          Logout
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <h5>Assistant Tools</h5>
          <p>
            This section will contain assistant-specific tools and appointments.
          </p>
          <div className="alert alert-info">
            Assistant functionality coming soon...
          </div>
        </div>
      </div>
    </div>
  );
}
