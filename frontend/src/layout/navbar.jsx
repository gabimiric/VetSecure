// src/layout/navbar.jsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import "./navbar.css";

export default function Navbar() {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  return (
    <header className="header">
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <Link to={isAuthenticated ? "/clinics" : "/"} className="brand">
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

            {isAuthenticated && (
              <>
                <NavLink
                  to="/register/petOwner"
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " active" : "")
                  }
                >
                  Register Owner
                </NavLink>

                <NavLink
                  to="/register/pet"
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " active" : "")
                  }
                >
                  Register Pet
                </NavLink>

                <NavLink
                  to="/register/clinic"
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " active" : "")
                  }
                >
                  Register Clinic
                </NavLink>

                <NavLink
                  to="/admin/requests"
                  className={({ isActive }) =>
                    "nav-link" + (isActive ? " active" : "")
                  }
                >
                  Admin Requests
                </NavLink>
              </>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Profile button visible only if logged in */}
            {isAuthenticated && user && (
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  "profile-pill" + (isActive ? " active" : "")
                }
              >
                <div className="profile-avatar" aria-hidden>
                  {String(user.username || user.email || "U")
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <span>{user.username || user.email}</span>
              </NavLink>
            )}

            {/* Sign Out button */}
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="button secondary"
                style={{
                  padding: "8px 16px",
                  fontSize: 14,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                className="button primary"
                style={{
                  padding: "8px 16px",
                  fontSize: 14,
                  textDecoration: "none",
                  whiteSpace: "nowrap"
                }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
