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
  });
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");
  const auth = useAuth(); // new

  // Debug: log when RegisterPage mounts to help diagnose unexpected redirects
  useEffect(() => {
    console.log("[RegisterPage] mounted");
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const isPetOwner = form.role === "PET_OWNER";

  const submit = async (e) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    try {
      // create user + pet owner record (AuthService.register may create owner)
      await AuthService.register({
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      });

      // Attempt an immediate login so subsequent requests are authenticated
      try {
        await auth.login(
          { usernameOrEmail: form.email, password: form.password },
          form.remember
        );
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
      setErrorMsg(err?.message || "Registration failed");
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
