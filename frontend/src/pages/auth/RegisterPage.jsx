/* src/pages/auth/RegisterPage.jsx */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/AuthService";
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
  });
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const isPetOwner = form.role === "PET_OWNER";

  const submit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      setStatus("mismatch");
      return;
    }

    if (form.password.length < 6) {
      setStatus("error");
      setErrorMsg("Password must be at least 6 characters long");
      return;
    }

    if (isPetOwner && (!form.firstName || !form.lastName)) {
      setStatus("error");
      setErrorMsg("First name and last name are required for pet owners");
      return;
    }

    setStatus("saving");

    try {
      // Use the register method instead of simpleRegister
      const user = await AuthService.register({
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      });

      console.log("Registration response:", user);

      // Store user data and login
      const storage = form.remember ? localStorage : sessionStorage;
      storage.setItem("current_user", JSON.stringify(user));
      storage.setItem("access_token", "devtoken");

      // In your AuthService register method, update the redirect logic:
      setStatus("success");

      // Redirect based on role
      setTimeout(() => {
        if (form.role === "PET_OWNER") {
          navigate("/dashboard"); // This will go to DashboardRouter which will show PetOwnerDashboard
        } else if (form.role === "CLINIC_ADMIN") {
          navigate("/dashboard");
        } else if (form.role === "VET") {
          navigate("/dashboard");
        } else if (form.role === "ASSISTANT") {
          navigate("/dashboard");
        } else {
          navigate("/dashboard");
        }
      }, 1000);
    } catch (err) {
      console.error("Registration error:", err);
      setStatus("error");
      setErrorMsg(err.message || "Registration failed. Please try again.");
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

        {/* Conditionally show pet owner fields */}
        {isPetOwner && (
          <>
            <label className="label">
              First name *
              <input
                name="firstName"
                value={form.firstName}
                onChange={onChange}
                className="tf"
                required={isPetOwner}
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
                required={isPetOwner}
                placeholder="Your last name"
              />
            </label>

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
            placeholder="At least 6 characters"
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
