// src/pages/profile/Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/AuthService";

export default function Profile() {
  const navigate = useNavigate();
  const stored = AuthService.getCurrentUser();
  const [user, setUser] = useState(stored || null);
  const [petOwner, setPetOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    async function load() {
      setLoading(true);
      // inside useEffect load() in Profile.jsx
      try {
        const res = await fetch(`/users/${user.id}`, {
          headers: {
            "Content-Type": "application/json",
            ...AuthService.authHeader(),
          },
        });
        const txt = await res.text();
        if (!res.ok)
          throw new Error(txt || `Failed to fetch user (${res.status})`);
        const u = txt ? JSON.parse(txt) : null;
        setUser(u);

        if (u && u.role && u.role.name === "PET_OWNER") {
          const r = await fetch(`/pet-owners/${u.id}`, {
            headers: {
              "Content-Type": "application/json",
              ...AuthService.authHeader(),
            },
          });
          const t2 = await r.text();
          if (r.ok && t2) setPetOwner(JSON.parse(t2));
          else setPetOwner(null);
        } else {
          setPetOwner(null);
        }
      } catch (err) {
        console.error("Error: ", err);
        alert("Failed to fetch user: " + (err.message || err));
        return;
      }
      setLoading(false);
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
      const res = await fetch(`/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...AuthService.authHeader(),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      // Update pet owner if applicable
      if (petOwner) {
        const poPayload = {
          firstName: petOwner.firstName,
          lastName: petOwner.lastName,
          phone: petOwner.phone,
          pets: petOwner.pets, // preserve pets array if backend expects it
        };
        const r = await fetch(`/pet-owners/${petOwner.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...AuthService.authHeader(),
          },
          body: JSON.stringify(poPayload),
        });
        if (!r.ok) throw new Error(await r.text());
      }

      // refresh local user cache
      const updated = await res.json();
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
      const res = await fetch(`/users/${user.id}`, {
        method: "DELETE",
        headers: { ...AuthService.authHeader() },
      });
      if (!res.ok) throw new Error(await res.text());
      AuthService.logout();
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      alert("Failed to delete account: " + err.message);
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
