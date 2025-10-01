import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AuthService } from "../services/AuthService";
import "../styles/animalDetails.css";

export default function AnimalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/pets/${id}`, {
          headers: { ...AuthService.authHeader() },
        });

        if (res.ok) {
          const p = await res.json();
          setPet(p);
          setForm({
            name: p.name || "",
            species: p.species || "",
            breed: p.breed || "",
            gender: p.gender || "",
            weight: p.weight ?? "",
            dateOfBirth: p.dateOfBirth || "",
          });
        } else {
          setPet(null);
        }
      } catch (err) {
        console.error(err);
        setPet(null);
        setError("Failed to load animal details.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const headers = {
        "Content-Type": "application/json",
        ...AuthService.authHeader(),
      };

      const payload = {
        ...form,
        weight: form.weight === "" ? null : Number(form.weight),
        owner: pet?.owner ? { id: pet.owner.id } : null,
      };

      const res = await fetch(`/pets/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to save pet");
      }

      const updated = await res.json();
      setPet(updated);
      setEditing(false);
    } catch (err) {
      console.error("Failed to save pet", err);
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm("Delete this pet? This action cannot be undone.");
    if (!ok) return;

    try {
      const res = await fetch(`/pets/${id}`, {
        method: "DELETE",
        headers: { ...AuthService.authHeader() },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Delete failed");
      }

      // go back to dashboard after deletion
      navigate("/dashboard");
    } catch (err) {
      console.error("Failed to delete pet", err);
      setError(err.message || "Delete failed");
    }
  };

  // small helpers
  const formatDOB = (dob) => {
    if (!dob) return "Unknown";
    try {
      // handle ISO YYYY-MM-DD or full timestmap
      const d = new Date(dob);
      return isNaN(d.getTime()) ? dob : d.toLocaleDateString();
    } catch {
      return dob;
    }
  };

  const computeAge = (dob) => {
    if (!dob) return "—";
    try {
      const d = new Date(dob);
      if (isNaN(d.getTime())) return "—";
      const diff = Date.now() - d.getTime();
      const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
      if (years > 0) return `${years} yr${years > 1 ? "s" : ""}`;
      const months = Math.floor(diff / (30.44 * 24 * 3600 * 1000));
      if (months > 0) return `${months} mo`;
      return "<1 mo";
    } catch {
      return "—";
    }
  };

  if (loading) {
    return (
      <div className="ad-container">
        <div className="ad-skeleton-header" />
        <div className="ad-skeleton-card" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="ad-container">
        <div className="ad-notfound">
          <h2>Animal not found</h2>
          <p className="muted">The requested animal could not be found.</p>
          <div className="ad-cta-row">
            <Link to="/dashboard" className="ad-btn-outline">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ad-container">
      {error && (
        <div className="ad-error">
          <div>{error}</div>
          <button
            className="ad-error-action"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="ad-header">
        <div className="ad-header-left">
          <div className="ad-avatar-large" aria-hidden>
            {(pet.name || "U")
              .split(" ")
              .map((s) => s[0] || "")
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="ad-title-wrap">
            <h1 className="ad-title">{pet.name}</h1>
            <div className="ad-subtitle">
              {pet.species || "Unknown species"}{" "}
              {pet.breed ? `· ${pet.breed}` : ""}
            </div>
            <div className="ad-meta">
              <span className="ad-badge">{pet.gender || "—"}</span>
              <span className="ad-badge outline">
                {formatDOB(pet.dateOfBirth || pet.born)}
              </span>
              <span className="ad-badge muted">
                Age: {computeAge(pet.dateOfBirth || pet.born)}
              </span>
            </div>
          </div>
        </div>

        <div className="ad-header-right">
          {!editing && (
            <button className="ad-btn" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
          <button onClick={handleDelete} className="ad-btn-danger">
            Delete
          </button>
          <Link to="/dashboard" className="ad-btn-outline">
            Back
          </Link>
        </div>
      </div>

      {/* Details card / Edit form */}
      <div className="ad-card">
        {!editing ? (
          <div className="ad-details-grid">
            <div className="ad-row">
              <div className="label">ID</div>
              <div className="value">{pet.id}</div>
            </div>

            <div className="ad-row">
              <div className="label">Born</div>
              <div className="value">
                {formatDOB(pet.dateOfBirth || pet.born)}
              </div>
            </div>

            <div className="ad-row">
              <div className="label">Species</div>
              <div className="value">{pet.species || "—"}</div>
            </div>

            <div className="ad-row">
              <div className="label">Breed</div>
              <div className="value">{pet.breed || "—"}</div>
            </div>

            <div className="ad-row">
              <div className="label">Gender</div>
              <div className="value">{pet.gender || "—"}</div>
            </div>

            <div className="ad-row">
              <div className="label">Weight</div>
              <div className="value">
                {pet.weight ?? "—"} {pet.weight ? "kg" : ""}
              </div>
            </div>

            <div className="ad-row">
              <div className="label">Owner</div>
              <div className="value">
                {pet.owner?.firstName ||
                  pet.owner?.username ||
                  pet.owner?.id ||
                  "—"}
              </div>
            </div>
          </div>
        ) : (
          <form className="ad-edit-form" onSubmit={save}>
            <div className="ad-form-grid">
              <label>
                <div className="form-label">Name</div>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  className="form-input"
                />
              </label>

              <label>
                <div className="form-label">Date of birth</div>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={onChange}
                  className="form-input"
                />
              </label>

              <label>
                <div className="form-label">Species</div>
                <input
                  name="species"
                  value={form.species}
                  onChange={onChange}
                  className="form-input"
                />
              </label>

              <label>
                <div className="form-label">Breed</div>
                <input
                  name="breed"
                  value={form.breed}
                  onChange={onChange}
                  className="form-input"
                />
              </label>

              <label>
                <div className="form-label">Gender</div>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={onChange}
                  className="form-select"
                >
                  <option value="">—</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </label>

              <label>
                <div className="form-label">Weight (kg)</div>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={form.weight}
                  onChange={onChange}
                  className="form-input"
                />
              </label>
            </div>

            <div className="ad-form-actions">
              <button
                type="submit"
                className="ad-btn-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="ad-btn-outline"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
