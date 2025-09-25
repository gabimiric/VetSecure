/* src/components/PetForm.jsx */
import React, { useState } from "react";
import { AuthService } from "../services/AuthService";
import "./PetForm.css";

/**
 * PetForm that uses the authenticated user on the backend as the owner.
 *
 * Assumptions / behavior:
 * - Authentication is handled elsewhere (JWT in localStorage or session cookie).
 * - Frontend does NOT send ownerId in the payload; backend must determine the owner
 *   from the authenticated principal for security.
 * - If using JWT, the token should be stored in localStorage under "access_token" (or change the key below).
 * - If no token is present, the form will still try to POST; if your backend requires Authorization header
 *   you should implement login/redirect in your app. Optionally you can call an endpoint like `/owners/me`
 *   to retrieve the current owner's id if you prefer the frontend to show details about the owner.
 */
export default function PetForm() {
  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "",
    weight: "",
    dateOfBirth: "",
  });
  const [status, setStatus] = useState(null);
  const [validationMessage, setValidationMessage] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setValidationMessage("");
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name || form.name.trim() === "") {
      setValidationMessage("Pet name is required.");
      setStatus("validation");
      return;
    }

    setStatus("saving");

    const current = AuthService.getCurrentUser();
    const payload = {
      name: form.name,
      species: form.species || null,
      breed: form.breed || null,
      gender: form.gender || null,
      weight: form.weight ? Number(form.weight) : null,
      dateOfBirth: form.dateOfBirth || null,
      owner: current ? { id: current.id } : null,
    };

    // If you store JWT in localStorage, include it here. Otherwise if you use a session cookie the backend
    // will read the session and no Authorization header is necessary.
    const token = AuthService.getToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch("/pets", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      setStatus("saved");
      setForm({
        name: "",
        species: "",
        breed: "",
        gender: "",
        weight: "",
        dateOfBirth: "",
      });
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="screen">
      <div className="card">
        <h2 className="title">Register Pet</h2>
        <form onSubmit={submit}>
          <label className="label">
            Pet name
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              required
              className="tf"
              placeholder="Fido"
            />
          </label>

          <label className="label">
            Species
            <input
              name="species"
              value={form.species}
              onChange={onChange}
              className="tf"
              placeholder="Dog, Cat, Bird..."
            />
          </label>

          <label className="label">
            Breed
            <input
              name="breed"
              value={form.breed}
              onChange={onChange}
              className="tf"
              placeholder="Labrador, Siamese..."
            />
          </label>

          <div style={{ display: "flex", gap: 12 }}>
            <label className="label" style={{ flex: 1 }}>
              Gender
              <select
                name="gender"
                value={form.gender}
                onChange={onChange}
                className="tf"
              >
                <option value="">— select —</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </label>

            <label className="label" style={{ flex: 1 }}>
              Weight (kg)
              <input
                name="weight"
                value={form.weight}
                onChange={onChange}
                type="number"
                step="0.1"
                className="tf"
                placeholder="e.g. 12.5"
              />
            </label>
          </div>

          <label className="label">
            Date of birth
            <input
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={onChange}
              type="date"
              className="tf"
            />
          </label>

          <button
            type="submit"
            className="primary"
            disabled={status === "saving"}
          >
            {status === "saving" ? "Saving..." : "Save Pet"}
          </button>

          {status === "saved" && (
            <p className="success">Pet saved successfully!</p>
          )}
          {status === "error" && (
            <p className="error">
              Failed to save pet. Check console or server logs.
            </p>
          )}
          {status === "validation" && validationMessage && (
            <p className="error">{validationMessage}</p>
          )}

          <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
            Note: the owner will be determined from the currently authenticated
            user on the server — the frontend does not send or trust owner IDs.
          </div>
        </form>
      </div>
    </div>
  );
}
