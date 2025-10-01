// src/pages/dashboard/AssistantDashboard.jsx
import React from "react";
import { AuthService } from "../../services/AuthService";
import { useNavigate } from "react-router-dom";

export default function AssistantDashboard() {
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
