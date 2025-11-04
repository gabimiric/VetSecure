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
      setClinics(data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch clinics:", err);
      setError("Unable to load clinics. Please try again later.");
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
    <div className="clinics-container" style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Available Veterinary Clinics</h1>
        <Link to="/dashboard" className="button secondary">
          Go to Dashboard
        </Link>
      </div>

      {clinics.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, background: "#f5f5f5", borderRadius: 8 }}>
          <p style={{ fontSize: 18, color: "#666" }}>No clinics available yet.</p>
          <p style={{ color: "#999" }}>Check back later for registered veterinary clinics.</p>
        </div>
      ) : (
        <div className="clinics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {clinics.map((clinic) => (
            <div key={clinic.id} className="clinic-card" style={{ 
              border: "1px solid #ddd", 
              borderRadius: 8, 
              padding: 20, 
              background: "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>{clinic.name}</h3>
              
              {clinic.address && (
                <p style={{ margin: "8px 0", color: "#666", fontSize: 14 }}>
                  📍 {clinic.address}
                </p>
              )}
              
              {clinic.phone && (
                <p style={{ margin: "8px 0", color: "#666", fontSize: 14 }}>
                  📞 {clinic.phone}
                </p>
              )}
              
              {clinic.email && (
                <p style={{ margin: "8px 0", color: "#666", fontSize: 14 }}>
                  ✉️ {clinic.email}
                </p>
              )}

              {clinic.description && (
                <p style={{ marginTop: 12, fontSize: 14, color: "#555", lineHeight: 1.5 }}>
                  {clinic.description}
                </p>
              )}

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #eee" }}>
                <Link 
                  to={`/clinics/${clinic.id}`} 
                  className="button primary"
                  style={{ width: "100%", textAlign: "center", display: "block", textDecoration: "none" }}
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
