import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./layout/navbar";
import Footer from "./layout/footer";

import Home from "./pages/home/home";
import OwnerForm from "./components/OwnerForm";
import ClinicRequestForm from "./components/ClinicRequestForm";
import AdminClinicRequests from "./components/AdminClinicRequests"; // <-- ADD THIS

export default function App() {
    return (
        <Router>
            <Navbar />
            <main style={{ minHeight: "70vh", padding: "16px" }}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/register/owner" element={<OwnerForm />} />
                    <Route path="/register/clinic" element={<ClinicRequestForm />} />
                    <Route path="/admin/requests" element={<AdminClinicRequests />} /> {/* <-- ADD THIS */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <Footer />
        </Router>
    );
}