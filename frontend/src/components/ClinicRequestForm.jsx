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

    // Validate that user is logged in
    if (!user || !user.email) {
      setErrMsg("You must be logged in to submit a clinic request.");
      return;
    }

    setSubmitting(true);
    try {
      // Fetch actual user data from backend to ensure we have the correct username from database
      let actualUsername = user.username;
      let actualEmail = user.email;

      try {
        const { api } = await import("../services/http");
        // Fetch current user from backend to get the actual username from database
        try {
          const userRes = await api.get("/users/me");
          if (userRes.data?.username) {
            actualUsername = userRes.data.username;
            console.log(
              "[ClinicRequestForm] Fetched username from DB:",
              actualUsername
            );
          }
          if (userRes.data?.email) {
            actualEmail = userRes.data.email;
          }
        } catch (err) {
          console.warn(
            "Could not fetch user from /users/me, trying by ID:",
            err
          );
          // Fallback: try fetching by ID
          if (user.id) {
            try {
              const userRes = await api.get(`/users/${user.id}`);
              if (userRes.data) {
                // Handle both direct user object and Optional<User> wrapper
                const userData = userRes.data.username
                  ? userRes.data
                  : userRes.data;
                if (userData.username) {
                  actualUsername = userData.username;
                  console.log(
                    "[ClinicRequestForm] Fetched username from DB by ID:",
                    actualUsername
                  );
                }
                if (userData.email) {
                  actualEmail = userData.email;
                }
              }
            } catch (err2) {
              console.warn(
                "Could not fetch user by ID either, using JWT data:",
                err2
              );
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch user data, using JWT data:", err);
      }

      // Use the actual username from database, fallback to JWT username, then email prefix
      const adminName =
        actualUsername || user.username || user.email?.split("@")[0] || "Admin";
      const adminEmail = actualEmail || user.email;

      console.log("[ClinicRequestForm] Submitting clinic request:", {
        adminName,
        adminEmail,
        userFromJWT: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });

      const payload = {
        ...form,
        adminName: adminName,
        adminEmail: adminEmail,
      };

      const res = await postClinicRequest(payload);
      setOkMsg(`Request #${res.id} submitted! Status: ${res.status}`);
      setForm({
        clinicName: "",
        address: "",
        city: "",
        phone: "",
      });
      // Redirect to dashboard after successful submission
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
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
