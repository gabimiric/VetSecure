import React from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
    const linkStyle = ({ isActive }) => ({
        padding: "8px 12px",
        borderRadius: 8,
        textDecoration: "none",
        color: isActive ? "#1f2937" : "#374151",
        background: isActive ? "#e5e7eb" : "transparent",
        marginRight: 8,
        fontWeight: 600,
    });

    return (
        <header
            style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                background: "white",
                borderBottom: "1px solid #e5e7eb",
            }}
        >
            <nav
                style={{
                    maxWidth: 1000,
                    margin: "0 auto",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Link
                    to="/"
                    style={{
                        fontWeight: 800,
                        fontSize: 18,
                        color: "#111827",
                        textDecoration: "none",
                    }}
                >
                    VetSecure
                </Link>

                <div>
                    <NavLink to="/" style={linkStyle} end>
                        Home
                    </NavLink>
                    <NavLink to="/register/petOwner" style={linkStyle}>
                        Register Owner
                    </NavLink>
                    <NavLink to="/register/clinic" style={linkStyle}>
                        Register Clinic
                    </NavLink>
                    <NavLink to="/admin/requests" style={linkStyle}>
                        See Requests
                    </NavLink>
                </div>
            </nav>
        </header>
    );
}