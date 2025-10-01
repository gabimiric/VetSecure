/* src/pages/auth/LoginPage.jsx */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/AuthService";
import "../../styles/auth.css";

export default function LoginPage() {
  const [form, setForm] = useState({
    usernameOrEmail: "",
    password: "",
    remember: false,
  });
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus("saving");
    try {
      await AuthService.login({
        usernameOrEmail: form.usernameOrEmail,
        password: form.password,
        remember: form.remember,
      });
      setStatus("saved");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <h2 className="auth-title">Sign in</h2>
        <label className="label">
          Username or Email
          <input
            name="usernameOrEmail"
            value={form.usernameOrEmail}
            onChange={onChange}
            className="tf"
            required
          />
        </label>
        <label className="label">
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            className="tf"
            required
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
          {status === "saving" ? "Signing in..." : "Sign in"}
        </button>

        {status === "error" && (
          <p className="error">Sign in failed — check credentials.</p>
        )}
      </form>
    </div>
  );
}
