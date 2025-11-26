import React from "react";

export default function Footer() {
    return (
        <footer
            style={{
                borderTop: "1px solid rgba(15, 23, 42, 0.06)",
                background: "rgba(255,255,255,0.92)",
                boxShadow: "0 -10px 24px rgba(15, 23, 42, 0.05)",
            }}
        >
            <div
                style={{
                    maxWidth: 1180,
                    margin: "0 auto",
                    padding: "14px 16px",
                    color: "#4b5563",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                }}
            >
                © {new Date().getFullYear()} VetSecure
            </div>
        </footer>
    );
}
