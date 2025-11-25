// src/pages/dashboard/AssistantDashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../services/http";
import { Link } from "react-router-dom";
import "../../styles/petowner.css";

export default function AssistantDashboard() {
  const { user, logout } = useAuth();
  const [vet, setVet] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAssistantData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Load vet/assistant profile (assistants are stored in vets table with role='assistant')
        let loadedClinic = null;
        try {
          const vetRes = await api.get(`/vets/${user.id}`);
          if (vetRes.data) {
            setVet(vetRes.data);
            if (vetRes.data.clinic) {
              loadedClinic = vetRes.data.clinic;
              setClinic(loadedClinic);
            } else if (vetRes.data.clinicId) {
              try {
                const clinicRes = await api.get(
                  `/api/admin/clinics/${vetRes.data.clinicId}`
                );
                loadedClinic = clinicRes.data;
                setClinic(loadedClinic);
              } catch (err) {
                console.warn("Failed to load clinic:", err);
              }
            }
          }
        } catch (err) {
          // Try alternative endpoint
          try {
            const allVetsRes = await api.get(`/vets`);
            const allVets = Array.isArray(allVetsRes.data) ? allVetsRes.data : [];
            const userVet = allVets.find((v) => v.user?.id === user.id || v.id === user.id);
            if (userVet) {
              setVet(userVet);
              if (userVet.clinic) {
                loadedClinic = userVet.clinic;
                setClinic(loadedClinic);
              }
            }
          } catch (err2) {
            console.warn("Failed to load assistant profile:", err2);
          }
        }

        // Load pet assignments (pets assigned to this clinic)
        if (loadedClinic?.id) {
          try {
            const petsRes = await api.get(`/pets`);
            const allPets = Array.isArray(petsRes.data) ? petsRes.data : [];
            // Filter pets by clinic
            const clinicPets = allPets.filter(
              (p) => p.clinicId === loadedClinic.id || p.clinic?.id === loadedClinic.id
            );
            setAssignments(clinicPets);
          } catch (err) {
            console.warn("Failed to load pet assignments:", err);
            setAssignments([]);
          }
        } else {
          setAssignments([]);
        }
      } catch (err) {
        console.error("Error loading assistant data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadAssistantData();
  }, [user?.id, clinic?.id]);

  if (loading) {
    return (
      <div className="po-container">
        <div className="po-header skeleton">
          <div className="skeleton-title" />
          <div className="skeleton-sub" />
        </div>
      </div>
    );
  }

  return (
    <div className="po-container">
      <div className="po-header">
        <div className="po-header-left">
        <div>
            <h1 className="po-title">Assistant Dashboard</h1>
            <div className="po-subtitle">
              Welcome, {vet?.firstName || user?.username || "Assistant"}
            </div>
          </div>
        </div>
        <div className="po-header-right">
          <Link to="/profile" className="po-btn-outline">
            Profile
          </Link>
          <button onClick={logout} className="po-logout">
          Logout
        </button>
        </div>
      </div>

      {error && (
        <div className="po-alert">
          {error}
          <button
            className="po-alert-action"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      <div className="po-stats">
        <div className="po-stat">
          <div className="stat-value">{assignments.length}</div>
          <div className="stat-label">Pet Assignments</div>
        </div>
        <div className="po-stat">
          <div className="stat-value">{clinic ? "Active" : "None"}</div>
          <div className="stat-label">Clinic</div>
        </div>
      </div>

      {clinic && (
        <div className="po-section">
          <div className="po-section-head">
            <h2 className="section-title">My Clinic</h2>
          </div>
          <div className="po-card">
            <div className="po-card-body">
              <h3>{clinic.name}</h3>
              <div className="po-card-meta">
                <div>
                  <strong>Address:</strong> {clinic.address}
                  {clinic.city && `, ${clinic.city}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="po-section">
        <div className="po-section-head">
          <h2 className="section-title">Pet Assignments</h2>
          <div className="section-sub">
            Pets assigned to your clinic
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="po-empty">
            <h3>No pet assignments</h3>
            <p className="muted">
              There are no pets currently assigned to your clinic.
            </p>
          </div>
        ) : (
          <div className="po-grid">
            {assignments.map((pet) => (
              <Link
                key={pet.id}
                to={`/animal/${pet.id}`}
                className="po-card"
              >
                <div className="po-card-media">
                  <div className="po-card-avatar">
                    {String(pet.name || "U")
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                </div>
                <div className="po-card-body">
                  <div className="po-card-title">{pet.name}</div>
                  <div className="po-card-meta">
                    <span>{pet.species || "Unknown"}</span>
                    <span className="dot">•</span>
                    <span>{pet.breed || "Mixed"}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
