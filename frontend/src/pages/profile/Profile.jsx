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
  const [ownerDraft, setOwnerDraft] = useState({ firstName: "", lastName: "", phone: "" });

  // MFA state
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaStatus, setMfaStatus] = useState(null);
  const [disableMfa, setDisableMfa] = useState({ password: "", code: "", recovery: "" });
  const [disableStatus, setDisableStatus] = useState(null);

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
          // First, try to resolve by current user (email from JWT) to avoid id/email mismatches
          try {
            const r = await api.get(`/api/owners/me`);
            setPetOwner(r.data);
            setOwnerDraft({
              firstName: r.data?.firstName || "",
              lastName: r.data?.lastName || "",
              phone: r.data?.phone || "",
            });
          } catch (e) {
            console.warn("Fallback to id-based and legacy endpoints due to /api/owners/me failure:", e?.response?.status);
            // If we get 403 from both, the user likely doesn't have a PetOwner profile yet
            if (e?.response?.status === 403 || e?.response?.status === 404) {
              try {
                const rId = await api.get(`/api/owners/${u.id}`);
                setPetOwner(rId.data);
                setOwnerDraft({
                  firstName: rId.data?.firstName || "",
                  lastName: rId.data?.lastName || "",
                  phone: rId.data?.phone || "",
                });
              } catch (eId) {
                console.warn("Fallback to legacy /pet-owners after id attempt:", eId?.response?.status);
                try {
                  const r2 = await api.get(`/pet-owners/${u.id}`);
                  setPetOwner(r2.data);
                  setOwnerDraft({
                    firstName: r2.data?.firstName || "",
                    lastName: r2.data?.lastName || "",
                    phone: r2.data?.phone || "",
                  });
                } catch (e2) {
                  if (e2?.response?.status === 403 || e2?.response?.status === 404) {
                    console.info("No PetOwner profile found or not authorized yet; allow creating one from UI.");
                    setPetOwner(null);
                  } else {
                    throw e2;
                  }
                }
              }
            } else {
              throw e;
            }
          }
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
      // Update user (keep existing role to satisfy backend validation)
      const payload = {
        username: user.username,
        email: user.email,
        role: user.role ? { id: user.role.id, name: user.role.name } : undefined
      };
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
      console.log('[Profile] startMfaSetup - authHeader:', AuthService.authHeader());
      console.log('[Profile] startMfaSetup - token:', AuthService.getToken());
      // include explicit auth header to be defensive in case defaults weren't applied
      const res = await api.post("/auth/mfa/setup", null, { headers: { ...AuthService.authHeader(), "Content-Type": "application/json" } });
      setMfaSetupData(res.data);
      setMfaStatus(null);
    } catch (err) {
      console.error("MFA setup error:", err);
      console.error("Error response:", err.response);
      try {
        console.error('MFA setup response data (stringified):', JSON.stringify(err.response?.data));
      } catch (e) { /* ignore stringify errors */ }
      setMfaStatus("error");
      // Extract readable message if possible
      let errorMessage = err.message;
      if (err?.response?.data) {
        if (typeof err.response.data === "string") errorMessage = err.response.data;
        else if (err.response.data.error) errorMessage = err.response.data.error;
        else errorMessage = JSON.stringify(err.response.data);
      }
      alert("Failed to start MFA setup: " + errorMessage + (err?.response?.data?.detail ? '\n\nDetail: ' + err.response.data.detail : ''));
    }
  };

  const verifyMfaSetup = async (e) => {
    e?.preventDefault?.();
    setMfaStatus("verifying");
    try {
      await api.post("/auth/mfa/verify-setup", { code: mfaCode });
      setMfaStatus("success");
      setMfaSetupData(null);
      setMfaCode("");
      // Reflect in UI immediately
      setUser((u) => ({ ...u, mfaEnabled: true }));
      alert("✅ MFA enabled successfully!");
    } catch (err) {
      console.error(err);
      setMfaStatus("error");
      alert("Failed to verify code: " + (err.response?.data || err.message));
    }
  };

  const submitDisableMfa = async (e) => {
    e?.preventDefault?.();
    setDisableStatus("saving");
    try {
      const payload = {
        password: disableMfa.password,
        code: disableMfa.code || undefined,
        recovery: disableMfa.recovery || undefined,
      };
      await api.post("/auth/mfa/disable", payload);
      setDisableStatus("saved");
      setDisableMfa({ password: "", code: "", recovery: "" });
      setUser((u) => ({ ...u, mfaEnabled: false }));
      alert("MFA has been disabled for your account.");
    } catch (err) {
      console.error(err);
      setDisableStatus("error");
      alert("Failed to disable MFA: " + (err.response?.data || err.message));
    }
  };

  const createOwnerForSelf = async (e) => {
    e?.preventDefault?.();
    setStatus("saving_owner");
    try {
      // OwnerController expects @RequestParam; send as query params
      const params = {
        firstName: ownerDraft.firstName || "First",
        lastName: ownerDraft.lastName || "Last",
        phone: ownerDraft.phone || "",
      };
      const res = await api.post("/api/owners/me", null, { params });
      setPetOwner(res.data);
      setStatus(null);
      alert("Owner profile created.");
    } catch (err) {
      console.error(err);
      setStatus("error_owner");
      // If backend returns 403 (already exists via @PreAuthorize), try fetching it
      if (err?.response?.status === 403) {
        try {
          const existing = await api.get("/api/owners/me");
          setPetOwner(existing.data);
          setOwnerDraft({
            firstName: existing.data?.firstName || "",
            lastName: existing.data?.lastName || "",
            phone: existing.data?.phone || "",
          });
          setStatus(null);
          return;
        } catch (fetchErr) {
          console.error("Fetch after 403 failed:", fetchErr);
        }
      }
      alert("Failed to create owner profile: " + (err.response?.data || err.message));
    }
  };

  return (
      <div style={{ maxWidth: 880, margin: "24px auto", padding: "0 16px" }}>
        <h2>Profile</h2>
        {loading ? (
            <p>Loading…</p>
        ) : (
            <form
                noValidate
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
                    <div>
                      {user.mfaEnabled ? (
                          <div style={{ marginBottom: 12 }}>
                            <p style={{ color: "#065f46", fontWeight: 600, marginBottom: 8 }}>MFA is currently ENABLED on your account.</p>
                            <details>
                              <summary style={{ cursor: "pointer", marginBottom: 8 }}>Disable MFA</summary>
                              <div style={{ display: "grid", gap: 8, maxWidth: 420, marginTop: 8 }}>
                                <input
                                    type="password"
                                    placeholder="Confirm password (required)"
                                    value={disableMfa.password}
                                    onChange={(e) => setDisableMfa((s) => ({ ...s, password: e.target.value }))}
                                    required
                                    style={{ padding: 10, border: "2px solid #ddd", borderRadius: 8 }}
                                />
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength="6"
                                    placeholder="6-digit code (optional)"
                                    value={disableMfa.code}
                                    onChange={(e) => setDisableMfa((s) => ({ ...s, code: e.target.value.replace(/\\D/g, "") }))}
                                    style={{ padding: 10, border: "2px solid #ddd", borderRadius: 8 }}
                                />
                                <input
                                    type="text"
                                    placeholder="Recovery code (optional alternative)"
                                    value={disableMfa.recovery}
                                    onChange={(e) => setDisableMfa((s) => ({ ...s, recovery: e.target.value }))}
                                    style={{ padding: 10, border: "2px solid #ddd", borderRadius: 8 }}
                                />
                                <button
                                    type="button"
                                    onClick={submitDisableMfa}
                                    disabled={!disableMfa.password || disableStatus === "saving"}
                                    style={{ padding: "10px 16px", background: "#ef4444", color: "white", border: "none", borderRadius: 8 }}
                                >
                                  {disableStatus === "saving" ? "Disabling…" : "Disable MFA"}
                                </button>
                              </div>
                            </details>
                          </div>
                      ) : (
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
                      )}
                    </div>
                ) : (
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: 8 }}>Scan this QR code with Google Authenticator:</p>
                      {mfaSetupData.qr ? (
                          <img
                              src={mfaSetupData.qr}
                              alt="MFA QR Code"
                              style={{ maxWidth: 256, border: "2px solid #ddd", borderRadius: 8, marginBottom: 12 }}
                          />
                      ) : (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ marginBottom: 8 }}>
                              <strong>QR image unavailable.</strong>
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              Use this secret in your authenticator app:
                            </div>
                            <div style={{ background: "#fff", padding: 8, borderRadius: 6, fontFamily: "monospace", display: 'inline-block' }}>
                              {mfaSetupData.secret}
                            </div>
                            <button
                                type="button"
                                onClick={() => { navigator.clipboard?.writeText(mfaSetupData.secret); alert('Secret copied to clipboard'); }}
                                style={{ marginLeft: 12, padding: '6px 10px', borderRadius: 6 }}
                            >
                              Copy
                            </button>
                            <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
                              Alternatively, add account manually using the URI below.
                            </div>
                            <div style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 12, background: '#fafafa', padding: 8, borderRadius: 6 }}>
                              {mfaSetupData.otpauth}
                            </div>
                          </div>
                      )}

                      <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
                        Or manually enter this secret: <code style={{ background: "#fff", padding: "2px 6px", borderRadius: 4 }}>{mfaSetupData.secret}</code>
                      </div>

                      <p style={{ fontWeight: 600, marginBottom: 8, color: "#dc2626" }}>
                        ⚠️ Save these recovery codes (one-time use):
                      </p>
                      <div style={{ background: "#fff", padding: 12, borderRadius: 8, marginBottom: 12, fontFamily: "monospace", fontSize: 13 }}>
                        {mfaSetupData.recoveryCodes.join(", ")}
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
                            type="button"
                            onClick={(e) => verifyMfaSetup(e)}
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
                      </div>
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

              {!petOwner && user.role?.name === "PET_OWNER" && (
                  <div style={{ marginTop: 16, padding: 16, border: "1px dashed #ddd", borderRadius: 8 }}>
                    <h4 style={{ marginTop: 0 }}>Create your Owner profile</h4>
                    <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
                      We couldn't find an existing owner record for your account. Create one to manage your pets.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 520 }}>
                      <input
                          placeholder="First name"
                          value={ownerDraft.firstName}
                          onChange={(e) => setOwnerDraft((s) => ({ ...s, firstName: e.target.value }))}
                          className="tf"
                          style={{ padding: 10, borderRadius: 8 }}
                      />
                      <input
                          placeholder="Last name"
                          value={ownerDraft.lastName}
                          onChange={(e) => setOwnerDraft((s) => ({ ...s, lastName: e.target.value }))}
                          className="tf"
                          style={{ padding: 10, borderRadius: 8 }}
                      />
                      <input
                          placeholder="Phone (optional)"
                          value={ownerDraft.phone}
                          onChange={(e) => setOwnerDraft((s) => ({ ...s, phone: e.target.value }))}
                          className="tf"
                          style={{ padding: 10, borderRadius: 8, gridColumn: "1 / span 2" }}
                      />
                    </div>
                    <button
                        type="button"
                        onClick={createOwnerForSelf}
                        disabled={status === "saving_owner"}
                        style={{ marginTop: 12, padding: "10px 14px", background: "#111827", color: "white", borderRadius: 8 }}
                    >
                      {status === "saving_owner" ? "Creating…" : "Create owner profile"}
                    </button>
                    {status === "error_owner" && (
                        <div style={{ color: "#b00020", marginTop: 8 }}>Failed to create owner. Check console for details.</div>
                    )}
                  </div>
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
