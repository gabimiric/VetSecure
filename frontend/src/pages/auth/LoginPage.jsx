/* src/pages/auth/LoginPage.jsx */
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import "../../styles/auth.css";

export default function LoginPage() {
  const [form, setForm] = useState({
    usernameOrEmail: "",
    password: "",
    remember: false,
  });
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, requestMfa, completeLogin } = useAuth();
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8082";

  // Guard ref to prevent infinite loops
  const hasNavigatedRef = React.useRef(false);

  // Handle backend OAuth2 redirect back to /login?token=... OR /login?mfaRequired=true&mfaToken=...
  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const token = params.get("token");
    const mfaRequired = params.get("mfaRequired");
    const mfaToken = params.get("mfaToken");
    const oauthError = params.get("error");

    if (oauthError) {
      setError("Google sign-in failed. Please try again.");
      navigate(location.pathname, { replace: true, state: location.state });
      return;
    }

    if (token) {
      try {
        completeLogin(token);
      } finally {
        // Clear query params so refresh doesn't re-run this effect
        navigate(location.pathname, { replace: true, state: location.state });
      }
      return;
    }

    if (mfaRequired === "true" && mfaToken) {
      requestMfa(mfaToken);
      navigate(location.pathname, { replace: true, state: location.state });
    }
  }, [location.pathname, location.search, location.state, completeLogin, requestMfa, navigate]);

  // Redirect authenticated users away from login page (with guard to prevent loops)
  useEffect(() => {
    if (isAuthenticated && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;

      // Check if there's a return path
      const returnPath = location.state?.from?.pathname;
      if (returnPath && returnPath !== "/login" && returnPath !== "/register") {
        console.log("[LoginPage] Redirecting to return path:", returnPath);
        navigate(returnPath, { replace: true });
        return;
      }

      // Default redirect to dashboard
      console.log("[LoginPage] auto-redirect to: /dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Reset navigation guard when authentication state changes
  useEffect(() => {
    if (!isAuthenticated) {
      hasNavigatedRef.current = false;
    }
  }, [isAuthenticated]);

  // Google OAuth2 is handled by backend redirect (no Google SDK in frontend)

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      const { AuthService } = await import("../../services/AuthService");

      // Debug: log the outgoing login payload so we can verify it's sending email (not username)
      console.log("[LoginPage] attempting login with:", {
        emailOrUsername: form.usernameOrEmail,
      });

      const result = await AuthService.login({
        usernameOrEmail: form.usernameOrEmail,
        password: form.password,
        remember: form.remember,
      });

      // If MFA required, trigger dialog via context and stay on page
      if (result && result.mfaRequired && result.mfaToken) {
        requestMfa(result.mfaToken);
        setStatus(null);
        return;
      }

      // If login returned a token, complete login in AuthProvider and navigate
      if (result && (result.token || result.token === 0)) {
        try {
          completeLogin(result.token);
        } catch (e) {
          console.warn("[LoginPage] completeLogin failed", e);
        }
        setStatus("saved");
        navigate("/dashboard");
        return;
      }

      // Success without MFA
      setStatus("saved");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      // Try to extract a friendly message from the thrown error body
      let msg = "Sign in failed — check credentials.";
      try {
        // err.message may contain raw JSON like '{"error":"Invalid credentials"}'
        const parsed = JSON.parse(err.message);
        if (parsed && (parsed.error || parsed.message))
          msg = parsed.error || parsed.message;
      } catch (e) {
        // not JSON, fall back to message text
        if (err.message) msg = err.message;
      }
      setStatus("error");
      setError(msg);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <h2 className="auth-title">Sign in to VetSecure</h2>

        {/* Google OAuth2 (Spring Security) - Official Google Button Style */}
        <a
          href={`${API_BASE}/oauth2/authorization/google`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "12px 16px",
            marginBottom: "16px",
            backgroundColor: "#fff",
            border: "1px solid #dadce0",
            borderRadius: "4px",
            color: "#3c4043",
            fontSize: "14px",
            fontWeight: 500,
            textDecoration: "none",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fff"}
        >
          <svg
            width="18"
            height="18"
            style={{ marginRight: "12px" }}
            viewBox="0 0 18 18"
          >
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.96-2.184l-2.908-2.258c-.806.54-1.837.86-3.052.86-2.348 0-4.337-1.586-5.047-3.717H.957v2.332C2.438 15.983 5.482 18 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.953 10.701c-.18-.54-.282-1.117-.282-1.701s.102-1.161.282-1.701V4.967H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.033l2.996-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.967L3.953 7.3C4.663 5.163 6.652 3.58 9 3.58z"
            />
          </svg>
          Sign in with Google
        </a>

        <div
          style={{ display: "flex", alignItems: "center", margin: "16px 0" }}
        >
          <hr style={{ flex: 1, opacity: 0.25 }} />
          <span style={{ padding: "0 12px", color: "#777", fontSize: 14 }}>
            or
          </span>
          <hr style={{ flex: 1, opacity: 0.25 }} />
        </div>

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
          <p className="error">
            {error || "Sign in failed — check credentials."}
          </p>
        )}
      </form>
    </div>
  );
}
