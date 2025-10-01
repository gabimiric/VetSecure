import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Navbar from "./layout/navbar";
import Footer from "./layout/footer";

import Home from "./pages/home/home";
import OwnerForm from "./components/OwnerForm";
import PetForm from "./components/PetForm";
import ClinicRequestForm from "./components/ClinicRequestForm";
import AdminClinicRequests from "./components/AdminClinicRequests"; // <-- ADD THIS

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardRouter from "./pages/dashboard/DashboardRouter";
import AnimalDetails from "./pages/AnimalDetails";
import Profile from "./pages/profile/Profile";

export default function App() {
  return (
    <Router>
      <Navbar />
      <main style={{ minHeight: "70vh", padding: "16px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/animal/:id" element={<AnimalDetails />} />
          <Route path="/register/petOwner" element={<OwnerForm />} />{" "}
          <Route path="/register/pet" element={<PetForm />} />
          <Route path="/register/clinic" element={<ClinicRequestForm />} />
          <Route
            path="/admin/requests"
            element={<AdminClinicRequests />}
          />{" "}
          {/* <-- ADD THIS */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}
