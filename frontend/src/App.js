// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./layout/navbar";
import Footer from "./layout/footer";

// pages
import Home from "./pages/home/home";
import OwnerForm from "./components/OwnerForm";

// clinic apply screens
import ClinicApply from "./pages/ClinicApply";          // <- create this file (wrapper around your form)
import ClinicApplySuccess from "./pages/ClinicApplySuccess"; // <- tiny thank-you screen

export default function App() {
    return (
        <Router>
            <Navbar />
            <main style={{ minHeight: "70vh", padding: "16px" }}>
                <Routes>
                    <Route path="/" element={<Home />} />

                    {/* Owner registration */}
                    <Route path="/register/owner" element={<OwnerForm />} />

                    {/* Clinic application flow */}
                    <Route path="/apply-clinic" element={<ClinicApply />} />
                    <Route path="/apply-clinic/success" element={<ClinicApplySuccess />} />

                    {/* Backwards compatibility for old link */}
                    <Route path="/register/clinic" element={<Navigate to="/apply-clinic" replace />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <Footer />
        </Router>
    );
}