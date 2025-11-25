// src/layout/navbar.jsx
import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import "./navbar.css";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // derive role name in a safe way (supports both object and string roles)
  const roleName = user?.role?.name || user?.role || null;

  return (
    <header className="header">
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        {/* Logo: point to dashboard when authenticated, otherwise home */}
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="brand">
          VetSecure
        </Link>

        <div className="nav-right">
          <div className="nav-links" role="menubar" aria-label="Primary">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/clinics"
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " active" : "")
                  }
                >
                  Clinics
                </NavLink>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " active" : "")
                  }
                >
                  Dashboard
                </NavLink>

                {/* Role-based links: Register Clinic only for clinic admin / super admin */}
                {(roleName === "CLINIC_ADMIN" || roleName === "SUPER_ADMIN") && (
                  <>
                    <NavLink
                      to="/register/clinic"
                      className={({ isActive }) =>
                        "nav-link" + (isActive ? " active" : "")
                      }
                    >
                      Register Clinic
                    </NavLink>
                    <NavLink
                      to="/clinic/staff"
                      className={({ isActive }) =>
                        "nav-link" + (isActive ? " active" : "")
                      }
                    >
                      Staff
                    </NavLink>
                    <NavLink
                      to="/clinic/appointments"
                      className={({ isActive }) =>
                        "nav-link" + (isActive ? " active" : "")
                      }
                    >
                      Appointments
                    </NavLink>
                  </>
                )}

                {/* Admin requests only for SUPER_ADMIN */}
                {roleName === "SUPER_ADMIN" && (
                  <NavLink
                    to="/admin/requests"
                    className={({ isActive }) =>
                      "nav-link" + (isActive ? " active" : "")
                    }
                  >
                    Admin Requests
                  </NavLink>
                )}
              </>
            ) : (
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
              >
                Home
              </NavLink>
            )}
          </div>

          <div className="nav-actions">
            {/* Removed Register / Login buttons from navbar (they are on Home). */}
          </div>
        </div>
      </nav>
    </header>
  );
}
