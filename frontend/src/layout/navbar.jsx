// src/layout/navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AuthService } from "../services/AuthService";
import "./navbar.css";

export default function Navbar() {
  const [user, setUser] = useState(() => AuthService.getCurrentUser());
  const location = useLocation();

  // keep navbar reactive to login/logout across tabs
  useEffect(() => {
    const onStorage = () => setUser(AuthService.getCurrentUser());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // update when route changes (works for immediate state updates too)
  useEffect(() => {
    setUser(AuthService.getCurrentUser());
  }, [location]);

  return (
    <header className="header">
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <Link to={user ? "/dashboard" : "/"} className="brand">
          VetSecure
        </Link>

        <div className="nav-right">
          <div className="nav-links" role="menubar" aria-label="Primary">
            {user ? (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active" : "")
                }
              >
                Dashboard
              </NavLink>
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
              See Requests
            </NavLink>
          </div>

          {/* Profile button visible only if logged in */}
          {user && (
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
        </div>
      </nav>
    </header>
  );
}
