import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import MfaVerificationDialog from "./components/MfaVerificationDialog";

import Navbar from "./layout/navbar";
import Footer from "./layout/footer";

import Home from "./pages/home/home";
import OwnerForm from "./components/OwnerForm";
import PetForm from "./components/PetForm";
import ClinicRequestForm from "./components/ClinicRequestForm";
import AdminClinicRequests from "./pages/admin/AdminClinicRequests";
import StaffManagement from "./pages/clinic/StaffManagement";
import AppointmentsPage from "./pages/clinic/AppointmentsPage";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardRouter from "./pages/dashboard/DashboardRouter";
import AnimalDetails from "./pages/AnimalDetails";
import Profile from "./pages/profile/Profile";
import ClinicsList from "./pages/ClinicsList";

import RequireAuth from "./auth/RequireAuth";

export default function App() {
  const { mfaRequired, mfaToken, handleMfaVerified, cancelMfa } = useAuth();

  return (
    <>
      <Navbar />
      {mfaRequired && mfaToken && (
        <MfaVerificationDialog
          mfaToken={mfaToken}
          onVerified={handleMfaVerified}
          onCancel={cancelMfa}
        />
      )}
      <main style={{ minHeight: "70vh", padding: 16 }}>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/clinics"
            element={
              <RequireAuth>
                <ClinicsList />
              </RequireAuth>
            }
          />

          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardRouter />
              </RequireAuth>
            }
          />

          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />

          <Route path="/animal/:id" element={<AnimalDetails />} />

          <Route
            path="/register/petOwner"
            element={
              <RequireAuth>
                <OwnerForm />
              </RequireAuth>
            }
          />
          <Route
            path="/register/pet"
            element={
              <RequireAuth>
                <PetForm />
              </RequireAuth>
            }
          />
          <Route
            path="/register/clinic"
            element={
              <RequireAuth roles={["ROLE_CLINIC_ADMIN", "ROLE_SUPER_ADMIN"]}>
                <ClinicRequestForm />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <RequireAuth roles={["ROLE_SUPER_ADMIN"]}>
                <AdminClinicRequests />
              </RequireAuth>
            }
          />
          <Route
            path="/clinic/staff"
            element={
              <RequireAuth roles={["ROLE_CLINIC_ADMIN", "ROLE_SUPER_ADMIN"]}>
                <StaffManagement />
              </RequireAuth>
            }
          />
          <Route
            path="/clinic/appointments"
            element={
              <RequireAuth roles={["ROLE_CLINIC_ADMIN", "ROLE_SUPER_ADMIN"]}>
                <AppointmentsPage />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
