import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
    return (
        <div style={{ maxWidth: 640, margin: "32px auto" }}>
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>Welcome to VetSecure</h1>
            <p style={{ color: "#4b5563", marginBottom: 24 }}>
                Register your clinic or create a pet owner account to book appointments.
            </p>

            <div style={{ display: "flex", gap: 12 }}>
                <Link
                    to="/register/owner"
                    style={{
                        padding: "12px 16px",
                        borderRadius: 10,
                        background: "linear-gradient(180deg,#4f46e5,#3b82f6)",
                        color: "white",
                        textDecoration: "none",
                        fontWeight: 700,
                    }}
                >
                    Register Owner
                </Link>
                <Link
                    to="/register/clinic"
                    style={{
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        color: "#111827",
                        textDecoration: "none",
                        fontWeight: 700,
                        background: "white",
                    }}
                >
                    Register Clinic
                </Link>
            </div>
        </div>
    );
}