// src/components/ClinicRequestForm.jsx
import React, { useState } from "react";
import { postClinicRequest } from "../api/client";
import "../styles/clinic.css";

export default function ClinicRequestForm() {
  const [form, setForm] = useState({
    clinicName: "",
    address: "",
    city: "",
    phone: "",
    adminName: "",
    adminEmail: "",
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
    setSubmitting(true);
    try {
      const res = await postClinicRequest(form);
      setOkMsg(`Request #${res.id} submitted! Status: ${res.status}`);
      setForm({
        clinicName: "",
        address: "",
        city: "",
        phone: "",
        adminName: "",
        adminEmail: "",
      });
    } catch (err) {
      try {
        const body = await err.response?.json?.();
        if (body?.error === "validation_failed" && body.fields) {
          const first = Object.entries(body.fields)[0];
          setErrMsg(`${first[0]}: ${first[1]}`);
        } else if (body?.error) {
          setErrMsg(String(body.error));
        } else {
          setErrMsg(err.message || "Failed to submit.");
        }
      } catch {
        setErrMsg(err.message || "Failed to submit.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="clinic-screen">
      <div className="clinic-card">
        <h2 className="clinic-title">Apply your clinic</h2>
        <p className="clinic-sub">
          Fill this form to request onboarding. We’ll review and notify you by
          email.
        </p>

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

          <div>
            <label className="clinic-label">Admin name *</label>
            <input
              className="clinic-input"
              value={form.adminName}
              onChange={(e) => setField("adminName", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="clinic-label">Admin email *</label>
            <input
              className="clinic-input"
              type="email"
              value={form.adminEmail}
              onChange={(e) => setField("adminEmail", e.target.value)}
              required
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
              We’ll review your request and contact you at the admin email
              provided.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
