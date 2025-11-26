import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../services/http";
import { useAuth } from "../../auth/AuthProvider";
import "../../styles/clinic.css";

export default function ClinicDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const roleName = user?.role?.name || user?.role || "";

  const [clinic, setClinic] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const canEdit =
    roleName === "SUPER_ADMIN" ||
    roleName === "CLINIC_ADMIN" ||
    roleName === "ROLE_SUPER_ADMIN" ||
    roleName === "ROLE_CLINIC_ADMIN";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (canEdit) {
          try {
            const res = await api.get(`/api/clinics/${id}`);
            setClinic(res.data);
            setForm({
              name: res.data?.name || "",
              address: res.data?.address || "",
              city: res.data?.city || "",
              phone: res.data?.phone || "",
              email: res.data?.email || "",
              description: res.data?.description || "",
            });
            return;
          } catch (err) {
            if (err?.response?.status !== 403) throw err;
            // fall through to read-only if admin call forbidden
          }
        }

        // Read-only path for non-admin roles: rely on approved clinics list
        const listRes = await api.get("/api/clinics");
        const approved = Array.isArray(listRes.data)
          ? listRes.data.filter((c) => c.status === "APPROVED")
          : [];
        const found = approved.find((c) => `${c.id}` === `${id}`);
        if (!found) {
          setError("Clinic not found or not approved yet.");
          setClinic(null);
          return;
        }
        setClinic(found);
        setForm({
          name: found?.name || "",
          address: found?.address || "",
          city: found?.city || "",
          phone: found?.phone || "",
          email: found?.email || "",
          description: found?.description || "",
        });
      } catch (err) {
        console.error(err);
        setError("Unable to load clinic details.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api.put(`/api/clinics/${id}`, form);
      setClinic(res.data);
      setForm({
        name: res.data?.name || "",
        address: res.data?.address || "",
        city: res.data?.city || "",
        phone: res.data?.phone || "",
        email: res.data?.email || "",
        description: res.data?.description || "",
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save clinic.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="clinic-screen">
        <div className="clinic-card">Loading clinic...</div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="clinic-screen">
        <div className="clinic-card">
          <h2>Clinic not found</h2>
          <p className="clinic-sub">We could not find that clinic.</p>
          <Link to="/clinics" className="ad-btn-outline">
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="clinic-screen">
      <div className="clinic-card">
        <div className="ad-header" style={{ paddingBottom: 0, borderBottom: "none" }}>
          <div className="ad-title-wrap">
            <h1 className="clinic-title">{clinic.name}</h1>
            <div className="clinic-sub">
              {clinic.address || "No address provided"}
              {clinic.city ? `, ${clinic.city}` : ""}
            </div>
          </div>
          <div className="ad-header-right">
            <Link to="/clinics" className="ad-btn-outline">
              Back
            </Link>
          </div>
        </div>

        {error && (
          <div className="clinic-alert err" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        <div className="ad-keyfacts" style={{ margin: "12px 0 16px" }}>
          <div className="ad-fact">
            <div className="label">Phone</div>
            <div className="value">{clinic.phone || "—"}</div>
          </div>
          <div className="ad-fact">
            <div className="label">Email</div>
            <div className="value">{clinic.email || "—"}</div>
          </div>
          <div className="ad-fact">
            <div className="label">Status</div>
            <div className="value">{clinic.status || "—"}</div>
          </div>
          <div className="ad-fact">
            <div className="label">Admin</div>
            <div className="value">
              {clinic.clinicAdmin?.username || clinic.clinicAdminId || "—"}
            </div>
          </div>
        </div>

        {canEdit ? (
          <form className="clinic-form" onSubmit={save}>
            <label className="clinic-label full">
              Name
              <input
                className="clinic-input"
                name="name"
                value={form.name}
                onChange={onChange}
                required
              />
            </label>
            <label className="clinic-label full">
              Address
              <input
                className="clinic-input"
                name="address"
                value={form.address}
                onChange={onChange}
              />
            </label>
            <label className="clinic-label">
              City
              <input
                className="clinic-input"
                name="city"
                value={form.city}
                onChange={onChange}
              />
            </label>
            <label className="clinic-label">
              Phone
              <input
                className="clinic-input"
                name="phone"
                value={form.phone}
                onChange={onChange}
              />
            </label>
            <label className="clinic-label full">
              Email
              <input
                className="clinic-input"
                name="email"
                value={form.email}
                onChange={onChange}
              />
            </label>
            <label className="clinic-label full">
              Description
              <textarea
                className="clinic-input"
                name="description"
                value={form.description}
                onChange={onChange}
                rows={3}
              />
            </label>

            <button
              type="submit"
              className="clinic-submit"
              disabled={saving}
              style={{ marginTop: 8 }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        ) : (
          <div className="clinic-alert ok" style={{ marginTop: 12 }}>
            You can only make appointments to the clinic.
          </div>
        )}
      </div>
    </div>
  );
}
