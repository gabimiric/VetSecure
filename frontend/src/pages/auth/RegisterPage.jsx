/* src/pages/auth/RegisterPage.jsx */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/AuthService";
import { useAuth } from "../../auth/AuthProvider"; // added import
import "../../styles/auth.css";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    remember: false,
    role: "PET_OWNER",
    firstName: "",
    lastName: "",
    phone: "",
    license: "", // for VET
    clinicId: "", // for VET and ASSISTANT
  });
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");
  const auth = useAuth();
  const { completeLogin } = auth;
  const [clinics, setClinics] = useState([]);

  // Load clinics for VET and ASSISTANT roles
  // Note: This may fail if endpoint requires auth - clinic can be selected after registration
  useEffect(() => {
    if (form.role === "VET" || form.role === "ASSISTANT") {
      const loadClinics = async () => {
        try {
          const { api } = await import("../../services/http");
          const res = await api.get("/api/clinics?status=APPROVED");
          setClinics(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
          console.warn(
            "Failed to load clinics (may require authentication):",
            err
          );
          // If clinics can't be loaded, user can select clinic after registration
          setClinics([]);
        }
      };
      loadClinics();
    } else {
      setClinics([]);
    }
  }, [form.role]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const isPetOwner = form.role === "PET_OWNER";
  const isVet = form.role === "VET";
  const isAssistant = form.role === "ASSISTANT";
  const needsClinic = isVet || isAssistant;

  const submit = async (e) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    if (form.password !== form.confirm) {
      setStatus("error");
      setErrorMsg("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setStatus("error");
      setErrorMsg("Password must be at least 8 characters");
      return;
    }

    // Allow registration without clinic if clinics couldn't be loaded
    // User can update their profile after registration to select a clinic
    if (needsClinic && !form.clinicId && clinics.length > 0) {
      setStatus("error");
      setErrorMsg("Please select a clinic");
      return;
    }

    try {
      // create user + role-specific profile
      await AuthService.register({
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        license: form.license,
        clinicId: form.clinicId ? Number(form.clinicId) : null,
      });

      // Attempt an immediate login so subsequent requests are authenticated
      try {
        const { AuthService } = await import("../../services/AuthService");
        const loginResult = await AuthService.login({
          usernameOrEmail: form.email,
          password: form.password,
          remember: form.remember,
        });

        // Complete login in AuthProvider to set user context with role
        if (loginResult?.token || loginResult?.user?.token) {
          const token = loginResult.token || loginResult.user?.token;
          completeLogin(token);
        }

        // only navigate after successful login
        navigate("/dashboard", { replace: true });
      } catch (loginErr) {
        // login failed — send user to login page and show message
        console.warn("Auto-login after register failed:", loginErr);
        setStatus("error");
        setErrorMsg("Registered but automatic login failed. Please sign in.");
        navigate("/login", { replace: true });
      }
    } catch (err) {
      console.error("Registration failed", err);
      setStatus("error");

      // Provide helpful error messages for common issues
      let errorMessage = err?.message || "Registration failed";

      if (
        errorMessage.includes("NetworkError") ||
        errorMessage.includes("CORS") ||
        errorMessage.includes("fetch")
      ) {
        errorMessage =
          "Cannot connect to backend server. Please ensure the backend is running on http://localhost:8082";
      } else if (errorMessage.includes("Failed to fetch roles")) {
        errorMessage =
          "Cannot fetch available roles. Please ensure the backend server is running.";
      }

      setErrorMsg(errorMessage);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <h2 className="auth-title">Create account</h2>

        <label className="label">
          Username *
          <input
            name="username"
            value={form.username}
            onChange={onChange}
            className="tf"
            required
            placeholder="Choose a username"
          />
        </label>

        <label className="label">
          Email *
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            className="tf"
            required
            placeholder="your@email.com"
          />
        </label>

        <label className="label">
          Role *
          <select
            name="role"
            value={form.role}
            onChange={onChange}
            className="tf"
            required
          >
            <option value="PET_OWNER">Pet owner</option>
            <option value="CLINIC_ADMIN">Clinic admin</option>
            <option value="ASSISTANT">Assistant</option>
            <option value="VET">Vet</option>
          </select>
        </label>

        {/* Conditionally show role-specific fields */}
        {(isPetOwner || isVet || isAssistant) && (
          <>
            <label className="label">
              First name *
              <input
                name="firstName"
                value={form.firstName}
                onChange={onChange}
                className="tf"
                required
                placeholder="Your first name"
              />
            </label>

            <label className="label">
              Last name *
              <input
                name="lastName"
                value={form.lastName}
                onChange={onChange}
                className="tf"
                required
                placeholder="Your last name"
              />
            </label>

            {isPetOwner && (
              <label className="label">
                Phone
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className="tf"
                  placeholder="Optional phone number"
                />
              </label>
            )}

            {isVet && (
              <label className="label">
                License Number *
                <input
                  name="license"
                  value={form.license}
                  onChange={onChange}
                  className="tf"
                  required
                  placeholder="Veterinary license number"
                />
              </label>
            )}

            {needsClinic && (
              <label className="label">
                Clinic *
                {clinics.length === 0 ? (
                  <div
                    style={{
                      padding: "8px 0",
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >
                    <p>
                      No clinics available. You can select a clinic after
                      registration.
                    </p>
                    <p style={{ fontSize: "12px", marginTop: "4px" }}>
                      Note: Clinic selection may require authentication. You can
                      update your profile after logging in.
                    </p>
                  </div>
                ) : (
                  <select
                    name="clinicId"
                    value={form.clinicId}
                    onChange={onChange}
                    className="tf"
                    required
                  >
                    <option value="">Select a clinic</option>
                    {clinics.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.name} - {clinic.city || clinic.address}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            )}
          </>
        )}

        <label className="label">
          Password *
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            className="tf"
            required
            minLength="6"
            placeholder="At least 8 characters"
          />
        </label>

        <label className="label">
          Confirm password *
          <input
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={onChange}
            className="tf"
            required
            placeholder="Re-enter your password"
          />
        </label>

        <label className="label checkbox-row">
          <input
            type="checkbox"
            name="remember"
            checked={form.remember}
            onChange={onChange}
          />{" "}
          Remember me
        </label>

        <button
          className="primary"
          type="submit"
          disabled={status === "saving"}
        >
          {status === "saving" ? "Creating Account..." : "Create Account"}
        </button>

        {status === "mismatch" && (
          <p className="error">Passwords do not match.</p>
        )}
        {status === "error" && <p className="error">{errorMsg}</p>}
        {status === "success" && (
          <p className="success">Registration successful! Redirecting...</p>
        )}
      </form>
    </div>
  );
}
