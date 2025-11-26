import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/http";
import "../styles/clinic.css";

export default function ClinicsList() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      // Fetch approved clinics from the backend
      const { data } = await api.get("/api/clinics");
      const approvedOnly = Array.isArray(data)
        ? data.filter((c) => c.status === "APPROVED")
        : [];
      setClinics(approvedOnly);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch clinics:", err);
      const msg =
        err.response?.status === 403
          ? "You do not have permission to view clinics. Please sign in again."
          : "Unable to load clinics. Please try again later.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p>Loading clinics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p className="error">{error}</p>
        <button onClick={fetchClinics} className="primary" style={{ marginTop: 16 }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className="clinics-container"
      style={{
        padding: "20px 16px 32px",
        width: "100%",
        maxWidth: "1100px",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Clinics</h1>
          <p style={{ margin: "6px 0 0", color: "#4b5563" }}>
            Explore approved clinics and open their details.
          </p>
        </div>
      </div>

      {clinics.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, background: "#f5f5f5", borderRadius: 8 }}>
          <p style={{ fontSize: 18, color: "#666" }}>No clinics available yet.</p>
          <p style={{ color: "#999" }}>Check back later for registered veterinary clinics.</p>
        </div>
      ) : (
        <div
          className="clinics-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
            justifyContent: "center",
            justifyItems: "stretch",
          }}
        >
          {clinics.map((clinic) => (
            <div
              key={clinic.id}
              className="clinic-card"
              style={{
                border: "1px solid rgba(15,23,42,0.08)",
                borderRadius: 14,
                padding: 18,
                background: "#fff",
                boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
                transition: "transform 0.16s, box-shadow 0.16s",
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>{clinic.name}</h3>
                <span style={{ fontSize: 12, color: "#4b5563" }}>#{clinic.id}</span>
              </div>

              {clinic.address && (
                <p style={{ margin: 0, color: "#475569", fontSize: 14 }}>
                  📍 {clinic.address}
                </p>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", color: "#475569", fontSize: 13 }}>
                {clinic.phone && <span>📞 {clinic.phone}</span>}
                {clinic.email && <span>✉️ {clinic.email}</span>}
              </div>

              {clinic.description && (
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "#475569", lineHeight: 1.5 }}>
                  {clinic.description}
                </p>
              )}

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <Link
                  to={`/clinics/${clinic.id}`}
                  className="button primary"
                  style={{
                    textAlign: "center",
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 44,
                    padding: "0 14px",
                    borderRadius: 10,
                    width: "100%",
                    boxSizing: "border-box",
                    textDecoration: "none",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    fontWeight: 800,
                    boxShadow: "0 8px 18px rgba(111, 123, 247, 0.16)",
                  }}
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
