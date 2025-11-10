// src/pages/home/home.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/AuthService";
import "../../styles/home.css";

export default function Home() {
  const nav = useNavigate();

  useEffect(() => {
    const authed = AuthService.isAuthenticated();
    console.log("[Home] mounted - isAuthenticated=", authed);
    if (authed) {
      // optimistic redirect to dashboard if user appears logged in
      nav("/dashboard", { replace: true });
    }
  }, [nav]);

  return (
    <div className="home-screen">
      <div className="home-card">
        <div className="home-hero">
          <div>
            <h1 className="home-title">Welcome to VetSecure</h1>
            <p className="home-sub">
              Secure, simple management for clinics and pet owners. Register an
              account or sign in to access your dashboard.
            </p>
            <div className="home-ctas">
              <button
                className="btn btn-outline"
                onClick={() => nav("/register")}
              >
                Create account
              </button>
              <button className="btn btn-primary" onClick={() => nav("/login")}>
                Sign in
              </button>
            </div>
          </div>

          <div className="home-illustration" aria-hidden>
            {/* lightweight SVG illustration */}
            <svg
              viewBox="0 0 200 160"
              width="200"
              height="160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="6"
                y="18"
                width="120"
                height="86"
                rx="12"
                fill="#eef2ff"
              />
              <circle cx="156" cy="56" r="36" fill="#e6f4ff" />
              <path
                d="M30 38h60M30 60h80"
                stroke="#c7d2fe"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <div className="home-features">
          <div className="feature">
            <h4>For Pet Owners</h4>
            <p className="muted">
              Register pets, view appointments and manage profiles.
            </p>
          </div>
          <div className="feature">
            <h4>For Clinics</h4>
            <p className="muted">
              Apply to onboard your clinic, review requests and manage staff.
            </p>
          </div>
          <div className="feature">
            <h4>Secure by Default</h4>
            <p className="muted">
              We aim to keep user data private and protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
