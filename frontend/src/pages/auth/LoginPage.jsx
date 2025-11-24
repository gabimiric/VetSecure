/* src/pages/auth/LoginPage.jsx */
import React, { useState, useEffect, useRef } from "react";
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
  const { signInWithGoogle, isAuthenticated, requestMfa, completeLogin } = useAuth();

  // Guard refs to prevent infinite loops
  const initializedRef = useRef(false);
  const buttonRef = useRef(null);
  const hasNavigatedRef = useRef(false);

  // Redirect authenticated users away from login page (with guard to prevent loops)
  useEffect(() => {
    if (isAuthenticated && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;

      // Check if there's a return path
      const returnPath = location.state?.from?.pathname;
      if (returnPath && returnPath !== "/login") {
        console.log("[LoginPage] Redirecting to return path:", returnPath);
        navigate(returnPath, { replace: true });
        return;
      }

      // Default redirect to clinics list for new OAuth users
      console.log("[LoginPage] Redirecting authenticated user to clinics list");
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Initialize Google Sign-In button (StrictMode-safe)
  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    // Debug logs: show the client ID from env and the current origin to help diagnose GSI 403
    try {
      console.log('[LoginPage] REACT_APP_GOOGLE_CLIENT_ID =', clientId);
      console.log('[LoginPage] window.location.origin =', window.location?.origin || window.location?.href);
    } catch (e) {
      // ignore in environments where location isn't available
      console.warn('[LoginPage] debug log error', e);
    }

    if (!window.google || !clientId) return;

    if (initializedRef.current) return; // prevent double init
    initializedRef.current = true;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const idToken = response?.credential;
          if (!idToken) {
            setError("No credential returned by Google.");
            return;
          }
          await signInWithGoogle(idToken);
          // Navigation handled by the first useEffect
        } catch (e) {
          console.error(e);
          setError("Failed to sign in with Google.");
        }
      },
      auto_select: false,
      ux_mode: "popup",
    });

    if (buttonRef.current) {
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "filled_blue",
        size: "large",
        shape: "pill",
        text: "signin_with",
        width: 320,
      });
    }
  }, [signInWithGoogle]);

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
      console.log('[LoginPage] attempting login with:', { emailOrUsername: form.usernameOrEmail });

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
          console.warn('[LoginPage] completeLogin failed', e);
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
        if (parsed && (parsed.error || parsed.message)) msg = parsed.error || parsed.message;
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

          {/* Google Sign-In Button */}
          <div style={{ marginBottom: 20 }}>
            <div ref={buttonRef} style={{ display: "flex", justifyContent: "center" }} />
            {error && <p className="error" style={{ marginTop: 8, fontSize: 14 }}>{error}</p>}
          </div>

          <div style={{ display: "flex", alignItems: "center", margin: "16px 0" }}>
            <hr style={{ flex: 1, opacity: 0.25 }} />
            <span style={{ padding: "0 12px", color: "#777", fontSize: 14 }}>or</span>
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
              <p className="error">{error || 'Sign in failed — check credentials.'}</p>
          )}
        </form>
      </div>
  );
}
