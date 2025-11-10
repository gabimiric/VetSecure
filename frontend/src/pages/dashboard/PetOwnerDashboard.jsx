import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthService } from "../../services/AuthService";
import { api } from "../../services/http";
import "../../styles/petowner.css";

export default function PetOwnerDashboard() {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [petOwnerData, setPetOwnerData] = useState(null);
  const [error, setError] = useState(null);

  const user = AuthService.getCurrentUser();

  useEffect(() => {
    async function loadDashboardData() {
      if (!user || !user.id) {
        setError("User not found");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // load pet owner (may be missing for new users)
        try {
          const res = await api.get(`/pet-owners/${user.id}`);
          if (res.status === 200) {
            setPetOwnerData(res.data);
          }
        } catch (petOwnerError) {
          console.warn("Could not load pet owner details:", petOwnerError);
        }

        // load pets for this owner (backend provides endpoint)
        await loadPets(user.id);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    async function loadPets(userId) {
      try {
         // try direct owner endpoint
         try {
           const r = await api.get(`/pets/owner/${userId}`);
           if (r.status === 200) {
             setPets(r.data || []);
             return;
           }
         } catch (e) {
           // fallback to GET /pets and filter
         }

         try {
           const r2 = await api.get(`/pets`);
           if (r2.status === 200) {
             const all = r2.data || [];
             const my = all.filter((p) => p.owner && p.owner.id === userId);
             setPets(my);
             return;
           }
         } catch (e) {
           console.error("Error loading pets from /pets:", e);
         }
         setPets([]);
      } catch (err) {
        console.error("Error loading pets:", err);
        setPets([]);
      }
    }

    loadDashboardData();
  }, [user?.id]);

  const handleLogout = () => {
    AuthService.logout();
    navigate("/login");
  };

  // display name / avatar initials
  const displayName = petOwnerData
    ? `${petOwnerData.firstName || ""} ${petOwnerData.lastName || ""}`.trim()
    : user?.username || "User";

  const initials = (displayName || "U")
    .split(" ")
    .map((s) => s[0] || "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // helper to format date and compute age
  const formatDOB = (dob) => {
    if (!dob) return "Unknown";
    try {
      const d = new Date(dob);
      return d.toLocaleDateString();
    } catch {
      return dob;
    }
  };

  const computeAge = (dob) => {
    if (!dob) return "—";
    try {
      const d = new Date(dob);
      const diff = Date.now() - d.getTime();
      const ageDate = new Date(diff);
      const years = Math.abs(ageDate.getUTCFullYear() - 1970);
      return `${years} yr${years !== 1 ? "s" : ""}`;
    } catch {
      return "—";
    }
  };

  // aggregate appointments if property exists on pets
  const totalAppointments = pets.reduce(
    (sum, p) => sum + (p.appointments ? Number(p.appointments) : 0),
    0
  );

  if (loading) {
    return (
      <div className="po-container">
        <div className="po-header skeleton">
          <div className="po-header-left">
            <div className="skeleton-title" />
            <div className="skeleton-sub" />
          </div>
          <div className="po-header-right">
            <div className="skeleton-btn" />
            <div className="skeleton-cta" />
          </div>
        </div>

        <div className="po-stats">
          <div className="skeleton-stat" />
          <div className="skeleton-stat" />
          <div className="skeleton-stat" />
        </div>

        <div className="po-cards">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="po-container">
      {/* Header */}
      <div className="po-header">
        <div className="po-header-left">
          <div className="po-avatar">{initials}</div>
          <div>
            <h1 className="po-title">Welcome back, {displayName}</h1>
            <div className="po-subtitle">Your Pet Owner Dashboard</div>
          </div>
        </div>

        <div className="po-header-right">
          <Link to="/profile" className="po-btn-outline">
            Profile
          </Link>

          <Link to="/register/pet" className="po-add-btn" title="Add pet">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              width="18"
              height="18"
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          <button onClick={handleLogout} className="po-logout">
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

      {/* Small stats */}
      <div className="po-stats">
        <div className="po-stat">
          <div className="stat-value">{pets.length}</div>
          <div className="stat-label">Pets</div>
        </div>

        <div className="po-stat">
          <div className="stat-value">{totalAppointments}</div>
          <div className="stat-label">Appointments</div>
        </div>

        <div className="po-stat">
          <div className="stat-value">
            {petOwnerData ? "Complete" : "Pending"}
          </div>
          <div className="stat-label">Profile</div>
        </div>
      </div>

      {/* Pet Owner Info */}
      <div className="po-owner-card">
        <div className="owner-left">
          <div className="owner-name">{displayName}</div>
          <div className="owner-email">{user?.email}</div>
        </div>
        <div className="owner-right">
          <div className="owner-item">
            <div className="owner-item-key">Phone</div>
            <div className="owner-item-val">
              {petOwnerData?.phone || "Not provided"}
            </div>
          </div>
          <div className="owner-item">
            <div className="owner-item-key">Pets</div>
            <div className="owner-item-val">{pets.length}</div>
          </div>
        </div>
      </div>

      {/* Pets Section */}
      <div className="po-section">
        <div className="po-section-head">
          <h2 className="section-title">My Pets</h2>
          <div className="section-sub">
            Manage your animals and view details
          </div>
        </div>

        {pets.length === 0 ? (
          <div className="po-empty">
            <div className="po-empty-illustration" aria-hidden />
            <h3>No pets yet</h3>
            <p className="muted">
              Add your first pet — it only takes a minute.
            </p>
            <Link to="/register/pet" className="btn-primary-lg">
              Register Your First Pet
            </Link>
          </div>
        ) : (
          <div className="po-grid">
            {pets.map((pet) => (
              <Link key={pet.id} to={`/animal/${pet.id}`} className="po-card">
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

                  <div className="po-card-info">
                    <div>
                      <div className="small-muted">Born</div>
                      <div>{formatDOB(pet.dateOfBirth || pet.born)}</div>
                    </div>

                    <div>
                      <div className="small-muted">Age</div>
                      <div>{computeAge(pet.dateOfBirth || pet.born)}</div>
                    </div>
                  </div>
                </div>

                <div className="po-card-footer">
                  <div className="view-details">View details →</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Dev info */}
      {process.env.NODE_ENV === "development" && (
        <div className="po-dev">
          <div>Debug — user id: {user?.id}</div>
          <div>Pet count: {pets.length}</div>
        </div>
      )}
    </div>
  );
}
