import React from "react";

export default function Footer() {
    return (
        <footer
            style={{
                borderTop: "1px solid #e5e7eb",
                background: "white",
            }}
        >
            <div style={{ maxWidth: 1000, margin: "0 auto", padding: "12px 16px", color: "#6b7280" }}>
                © {new Date().getFullYear()} VetSecure
            </div>
        </footer>
    );
}