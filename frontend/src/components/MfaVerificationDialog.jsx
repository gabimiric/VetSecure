import React, { useState } from "react";

export default function MfaVerificationDialog({ mfaToken, onVerified, onCancel }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8082/auth/mfa/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfaToken, code }),
      });

      if (response.ok) {
        const data = await response.json();
        onVerified(data.accessToken, data.refreshToken);
      } else {
        const errorData = await response.text();
        setError(errorData || "Invalid MFA code");
      }
    } catch (err) {
      console.error("MFA verification error:", err);
      setError("Failed to verify MFA code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 32,
          maxWidth: 400,
          width: "90%",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Two-Factor Authentication</h2>
        <p style={{ color: "#666", marginBottom: 24 }}>
          Enter the 6-digit code from your authenticator app.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="6"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            autoFocus
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: 24,
              textAlign: "center",
              letterSpacing: 8,
              border: "2px solid #ddd",
              borderRadius: 8,
              marginBottom: 16,
            }}
            required
          />

          {error && (
            <p style={{ color: "#d32f2f", fontSize: 14, marginBottom: 16 }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 24px",
                border: "1px solid #ddd",
                background: "#fff",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              style={{
                flex: 1,
                padding: "12px 24px",
                border: "none",
                background: code.length === 6 ? "#1976d2" : "#ccc",
                color: "#fff",
                borderRadius: 8,
                cursor: code.length === 6 ? "pointer" : "not-allowed",
                fontSize: 16,
              }}
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>

        <p style={{ fontSize: 12, color: "#999", marginTop: 16, textAlign: "center" }}>
          Lost your device? Contact support for recovery options.
        </p>
      </div>
    </div>
  );
}
