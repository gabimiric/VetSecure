// src/pages/dashboard/DashboardRouter.jsx
import React from "react";
import { useAuth } from "../../auth/AuthProvider";
import ClinicAdminDashboard from "./ClinicAdminDashboard";
import SuperAdminDashboard from "../admin/AdminClinicRequests";
import PetOwnerDashboard from "./PetOwnerDashboard";
import VetDashboard from "./VetDashboard";
import AssistantDashboard from "./AssistantDashboard";

export default function DashboardRouter() {
  const { user } = useAuth();

  const roles = React.useMemo(() => {
    if (!user) return [];
    if (Array.isArray(user.roles)) return user.roles.map((r) => (r?.name || r)).filter(Boolean);
    if (user.role) return [user.role?.name || user.role].filter(Boolean);
    return [];
  }, [user]);

  React.useEffect(() => {
    console.debug("DashboardRouter user:", user);
    console.debug("DashboardRouter resolved roles:", roles);
  }, [user, roles]);

  // Precedence: CLINIC_ADMIN first, then SUPER_ADMIN, then others
  if (roles.includes("CLINIC_ADMIN") || roles.includes("ROLE_CLINIC_ADMIN")) {
    return <ClinicAdminDashboard />;
  }

  if (roles.includes("SUPER_ADMIN") || roles.includes("ROLE_SUPER_ADMIN")) {
    // use AdminClinicRequests as the Super Admin dashboard per request
    return <SuperAdminDashboard />;
  }

  const roleName = roles[0] || "PET_OWNER";

  switch (roleName) {
    case "PET_OWNER":
      return <PetOwnerDashboard />;
    case "VET":
      return <VetDashboard />;
    case "ASSISTANT":
      return <AssistantDashboard />;
    default:
      return (
        <div style={{ padding: 24 }}>
          <h2>Dashboard for role: {roleName}</h2>
          <p>No specific dashboard implemented for this role yet.</p>
        </div>
      );
  }
}
