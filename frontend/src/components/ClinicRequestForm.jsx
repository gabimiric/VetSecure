// src/components/ClinicRequestForm.jsx
import React, { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { postClinicRequest } from "../api/client";
import "../styles/clinic.css";

export default function ClinicRequestForm() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    clinicName: "",
    address: "",
    city: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  function setField(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setOkMsg("");
    setErrMsg("");

    if (!user || !user.email) {
      setErrMsg("You must be logged in to submit a clinic request.");
      return;
    }

    setSubmitting(true);
    try {
      // resolve adminName/adminEmail as before
      const adminName = user.username || user.email?.split("@")[0] || "Admin";
      const adminEmail = user.email;

      const payload = {
        clinicName: form.clinicName,
        address: form.address,
        city: form.city,
        phone: form.phone,
        adminName,
        adminEmail,
        // schedules and description intentionally omitted to match ClinicRequest model
      };

      const res = await postClinicRequest(payload);
      setOkMsg(`Request #${res.id} submitted! Status: ${res.status}`);
      setForm({
        clinicName: "",
        address: "",
        city: "",
        phone: "",
      });
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1200);
    } catch (err) {
      setErrMsg(err.response?.data?.message || err.message || "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="clinic-screen">
      <div className="clinic-card">
        <h2 className="clinic-title">Apply your clinic</h2>
        <p className="clinic-sub">
          Fill this form to request onboarding. We'll review and notify you by
          email at <strong>{user?.email || "your registered email"}</strong>.
        </p>
        {user && (
          <p
            className="clinic-sub"
            style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}
          >
            Request will be submitted as:{" "}
            <strong>{user.username || user.email?.split("@")[0]}</strong> (
            {user.email})
          </p>
        )}

        {okMsg && <div className="clinic-alert ok">{okMsg}</div>}
        {errMsg && <div className="clinic-alert err">{errMsg}</div>}

        <form className="clinic-form" onSubmit={onSubmit} noValidate>
          <div className="full">
            <label className="clinic-label">Clinic name *</label>
            <input
              className="clinic-input"
              value={form.clinicName}
              onChange={(e) => setField("clinicName", e.target.value)}
              required
            />
          </div>

          <div className="full">
            <label className="clinic-label">Address *</label>
            <input
              className="clinic-input"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="clinic-label">City</label>
            <input
              className="clinic-input"
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
            />
          </div>

          <div>
            <label className="clinic-label">Phone</label>
            <input
              className="clinic-input"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </div>

          <div className="full">
            <button
              type="submit"
              disabled={submitting}
              className="clinic-submit"
            >
              {submitting ? "Submitting…" : "Submit request"}
            </button>
            <div className="clinic-help">
              We'll review your request and contact you at your registered email
              address ({user?.email || "your account email"}).
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
