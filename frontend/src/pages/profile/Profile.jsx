// src/pages/profile/Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/AuthService";
import { api } from "../../services/http";

export default function Profile() {
  const navigate = useNavigate();
  const stored = AuthService.getCurrentUser();
  const [user, setUser] = useState(stored || null);
  const [petOwner, setPetOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  
  // MFA state
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaStatus, setMfaStatus] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    async function load() {
      setLoading(true);
      // inside useEffect load() in Profile.jsx
      try {
        const res = await api.get(`/users/${user.id}`);
        const u = res.data;
        setUser(u);

        if (u && u.role && u.role.name === "PET_OWNER") {
          const r = await api.get(`/pet-owners/${u.id}`);
          setPetOwner(r.data);
        } else {
          setPetOwner(null);
        }
      } catch (err) {
        console.error("Error: ", err);
        alert("Failed to fetch user: " + (err.response?.data || err.message || err));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user?.id, navigate]);

  if (!user) return null;

  const onChangeUser = (e) => {
    const { name, value } = e.target;
    setUser((s) => ({ ...s, [name]: value }));
  };

  const onChangePetOwner = (e) => {
    const { name, value } = e.target;
    setPetOwner((s) => ({ ...s, [name]: value }));
  };

  const save = async (e) => {
    e?.preventDefault();
    setStatus("saving");
    try {
      // Update user (do not send role or passwordHash)
      const payload = { username: user.username, email: user.email };
      const res = await api.put(`/users/${user.id}`, payload);

      // Update pet owner if applicable
      if (petOwner) {
        const poPayload = {
          firstName: petOwner.firstName,
          lastName: petOwner.lastName,
          phone: petOwner.phone,
          pets: petOwner.pets, // preserve pets array if backend expects it
        };
        await api.put(`/pet-owners/${petOwner.id}`, poPayload);
      }

      // refresh local user cache
      const updated = res.data;
      // AuthService stores current_user in session/local storage; update it
      const storage = localStorage.getItem("access_token")
        ? localStorage
        : sessionStorage;
      storage.setItem(
        "current_user",
        JSON.stringify({
          ...stored,
          username: updated.username,
          email: updated.email,
          role: updated.role,
        })
      );
      sessionStorage.setItem(
        "current_user",
        JSON.stringify({
          ...stored,
          username: updated.username,
          email: updated.email,
          role: updated.role,
        })
      );

      setStatus("saved");
      setTimeout(() => setStatus(null), 1500);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  const logout = () => {
    AuthService.logout();
    navigate("/", { replace: true });
  };

  const deleteAccount = async () => {
    const ok = window.confirm(
      "Delete your account permanently? This cannot be undone."
    );
    if (!ok) return;
    try {
      await api.delete(`/users/${user.id}`);
      AuthService.logout();
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      alert("Failed to delete account: " + err.message);
    }
  };

  // MFA Setup
  const startMfaSetup = async () => {
    setMfaStatus("loading");
    try {
      const res = await api.post("/auth/mfa/setup");
      setMfaSetupData(res.data);
      setMfaStatus(null);
    } catch (err) {
      console.error("MFA setup error:", err);
      console.error("Error response:", err.response);
      setMfaStatus("error");
      const errorMessage = typeof err.response?.data === 'string' 
        ? err.response.data 
        : JSON.stringify(err.response?.data) || err.message;
      alert("Failed to start MFA setup: " + errorMessage);
    }
  };

  const verifyMfaSetup = async (e) => {
    e.preventDefault();
    setMfaStatus("verifying");
    try {
      await api.post("/auth/mfa/verify-setup", { code: mfaCode });
      setMfaStatus("success");
      setMfaSetupData(null);
      setMfaCode("");
      alert("✅ MFA enabled successfully! Log out and try logging in again to test it.");
      // Refresh user data
      window.location.reload();
    } catch (err) {
      console.error(err);
      setMfaStatus("error");
      alert("Failed to verify code: " + (err.response?.data || err.message));
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: "24px auto", padding: "0 16px" }}>
      <h2>Profile</h2>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <form
          onSubmit={save}
          style={{
            background: "white",
            padding: 16,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <label
              style={{ display: "block", marginBottom: 6, color: "#374151" }}
            >
              Username
            </label>
            <input
              name="username"
              value={user.username || ""}
              onChange={onChangeUser}
              className="tf"
              style={{ width: "100%", padding: 10, borderRadius: 8 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{ display: "block", marginBottom: 6, color: "#374151" }}
            >
              Email
            </label>
            <input
              name="email"
              value={user.email || ""}
              onChange={onChangeUser}
              className="tf"
              style={{ width: "100%", padding: 10, borderRadius: 8 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{ display: "block", marginBottom: 6, color: "#374151" }}
            >
              Role
            </label>
            <div
              style={{ padding: 10, background: "#f9fafb", borderRadius: 8 }}
            >
              {user.role?.name || "—"}
            </div>
          </div>

          {/* MFA Setup Section */}
          <div style={{ marginTop: 24, marginBottom: 24, padding: 16, background: "#f0fdf4", borderRadius: 12, border: "1px solid #86efac" }}>
            <h4 style={{ marginTop: 0 }}>Two-Factor Authentication (MFA)</h4>
            <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
              Protect your account with an extra layer of security.
            </p>

            {!mfaSetupData ? (
              <button
                type="button"
                onClick={startMfaSetup}
                disabled={mfaStatus === "loading"}
                style={{
                  padding: "10px 16px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: mfaStatus === "loading" ? "wait" : "pointer",
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                {mfaStatus === "loading" ? "Setting up..." : "🔐 Enable MFA"}
              </button>
            ) : (
              <div>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Scan this QR code with Google Authenticator:</p>
                <img 
                  src={mfaSetupData.qr} 
                  alt="MFA QR Code" 
                  style={{ maxWidth: 256, border: "2px solid #ddd", borderRadius: 8, marginBottom: 12 }}
                />
                
                <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
                  Or manually enter this secret: <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4 }}>{mfaSetupData.secret}</code>
                </p>

                <p style={{ fontWeight: 600, marginBottom: 8, color: "#dc2626" }}>
                  ⚠️ Save these recovery codes (one-time use):
                </p>
                <div style={{ background: "#fff", padding: 12, borderRadius: 8, marginBottom: 12, fontFamily: "monospace", fontSize: 13 }}>
                  {mfaSetupData.recoveryCodes.join(", ")}
                </div>

                <form onSubmit={verifyMfaSetup} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="6"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit code"
                    required
                    style={{
                      padding: "10px 12px",
                      border: "2px solid #ddd",
                      borderRadius: 8,
                      fontSize: 16,
                      width: 180,
                      textAlign: "center",
                      letterSpacing: 4
                    }}
                  />
                  <button
                    type="submit"
                    disabled={mfaCode.length !== 6 || mfaStatus === "verifying"}
                    style={{
                      padding: "10px 16px",
                      background: mfaCode.length === 6 ? "#10b981" : "#ccc",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      cursor: mfaCode.length === 6 && mfaStatus !== "verifying" ? "pointer" : "not-allowed",
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    {mfaStatus === "verifying" ? "Verifying..." : "Verify & Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMfaSetupData(null); setMfaCode(""); }}
                    style={{
                      padding: "10px 16px",
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 14
                    }}
                  >
                    Cancel
                  </button>
                </form>
              </div>
            )}
          </div>

          {petOwner && (
            <>
              <h4 style={{ marginTop: 12 }}>Owner profile</h4>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      color: "#374151",
                    }}
                  >
                    First name
                  </label>
                  <input
                    name="firstName"
                    value={petOwner.firstName || ""}
                    onChange={onChangePetOwner}
                    className="tf"
                    style={{ width: "100%", padding: 10, borderRadius: 8 }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      color: "#374151",
                    }}
                  >
                    Last name
                  </label>
                  <input
                    name="lastName"
                    value={petOwner.lastName || ""}
                    onChange={onChangePetOwner}
                    className="tf"
                    style={{ width: "100%", padding: 10, borderRadius: 8 }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    color: "#374151",
                  }}
                >
                  Phone
                </label>
                <input
                  name="phone"
                  value={petOwner.phone || ""}
                  onChange={onChangePetOwner}
                  className="tf"
                  style={{ width: "100%", padding: 10, borderRadius: 8 }}
                />
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button
              type="submit"
              className="primary"
              style={{ padding: "10px 14px" }}
              disabled={status === "saving"}
            >
              {status === "saving" ? "Saving…" : "Save changes"}
            </button>

            <button
              type="button"
              onClick={logout}
              className="btn"
              style={{
                padding: "10px 14px",
                background: "#ef4444",
                color: "white",
                borderRadius: 8,
              }}
            >
              Logout
            </button>

            <button
              type="button"
              onClick={deleteAccount}
              className="btn"
              style={{
                padding: "10px 14px",
                background: "#111827",
                color: "white",
                borderRadius: 8,
              }}
            >
              Delete account
            </button>

            {status === "saved" && (
              <div style={{ color: "#0a7a2f", alignSelf: "center" }}>Saved</div>
            )}
            {status === "error" && (
              <div style={{ color: "#b00020", alignSelf: "center" }}>
                Failed to save
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
