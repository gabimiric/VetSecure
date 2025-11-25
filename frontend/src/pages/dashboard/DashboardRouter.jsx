// src/pages/dashboard/DashboardRouter.jsx
import React from "react";
import { useAuth } from "../../auth/AuthProvider";
import PetOwnerDashboard from "./PetOwnerDashboard";
import ClinicAdminDashboard from "./ClinicAdminDashboard";
import VetDashboard from "./VetDashboard";
import AssistantDashboard from "./AssistantDashboard";
import { Navigate } from "react-router-dom";

export default function DashboardRouter() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle both role object and role string formats
  // Also check JWT claims for role
  const roleName =
    user.role?.name || user.role || user.roles?.[0] || "PET_OWNER";

  console.log("User role:", roleName, "Full user:", user); // Debug log

  switch (roleName) {
    case "PET_OWNER":
      return <PetOwnerDashboard />;
    case "CLINIC_ADMIN":
      return <ClinicAdminDashboard />;
    case "VET":
      return <VetDashboard />;
    case "ASSISTANT":
      return <AssistantDashboard />;
    case "SUPER_ADMIN":
      // Redirect to admin requests page
      return <Navigate to="/admin/requests" replace />;
    default:
      return (
        <div style={{ padding: 24 }}>
          <h2>Dashboard for role: {roleName}</h2>
          <p>No specific dashboard implemented for this role yet.</p>
        </div>
      );
  }
}
