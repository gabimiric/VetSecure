import React from "react";
import { api } from "../services/http"; // existing axios instance used across app
import { useAuth } from "../auth/AuthProvider";
import { Link } from "react-router-dom";

export default function AppointmentForm({ onCreated, initialClinicId, initialPetId }) {
  const [clinics, setClinics] = React.useState([]);
  const [pets, setPets] = React.useState([]);
  const [clinicId, setClinicId] = React.useState(initialClinicId ?? "");
  const [petId, setPetId] = React.useState(initialPetId ?? "");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [vets, setVets] = React.useState([]);
  const [vetId, setVetId] = React.useState("");
  const [schedules, setSchedules] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const { user } = useAuth();

  const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  React.useEffect(() => {
    async function load() {
      try {
        const c = await api.get("/api/clinics?status=APPROVED");
        setClinics(Array.isArray(c.data) ? c.data : []);
      } catch (e) {
        setClinics([]);
      }
      // Try owner-scoped endpoints first (backend exposes /pets/owner/me and /pets/owner/{ownerId})
      const petPaths = [
        "/pets/owner/me",
        `/pets/owner/${user?.id}`,
        "/api/pets/owner/me",
        `/api/pets/owner/${user?.id}`,
        "/pets",
        "/api/pets",
      ];

      let gotPets = false;
      for (const path of petPaths) {
        try {
          const p = await api.get(path);
          if (p && (p.status === 200 || p.status === 204)) {
            const data = Array.isArray(p.data) ? p.data : p.data?.items || [];
            // If the endpoint returns all pets, filter by owner id when we have it
            const list = Array.isArray(data)
              ? (user && user.id ? data.filter(px => px.owner && px.owner.id === user.id) : data)
              : [];
            setPets(list || []);
            gotPets = true;
            break;
          }
        } catch (err) {
          // continue to next path on 404/403/network error
          console.info(`pets load attempt ${path} failed:`, err?.response?.status || err.message);
        }
      }
      if (!gotPets) setPets([]);
    }
    load();
  }, []);

  React.useEffect(() => {
    if (initialClinicId) setClinicId(String(initialClinicId));
  }, [initialClinicId]);

  React.useEffect(() => {
    if (initialPetId) setPetId(String(initialPetId));
  }, [initialPetId]);

  React.useEffect(() => {
    async function loadSchedules() {
      if (!clinicId) return setSchedules([]);
      try {
        const res = await api.get(`/api/clinics/${clinicId}/schedules`);
        setSchedules(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        setSchedules([]);
      }
    }
    loadSchedules();
  }, [clinicId]);

  // load vets when clinic changes (backend exposes /vets; filter client-side by clinic)
  React.useEffect(() => {
    async function loadVetsForClinic() {
      setVets([]);
      setVetId("");
      if (!clinicId) return;
      try {
        const res = await api.get("/vets");
        const all = Array.isArray(res.data) ? res.data : [];
        const filtered = all.filter(v => {
          // support both v.clinic?.id and v.clinicId shapes
          return (v.clinic && String(v.clinic.id) === String(clinicId)) || (v.clinicId && String(v.clinicId) === String(clinicId));
        });
        setVets(filtered);
      } catch (e) {
        setVets([]);
      }
    }
    loadVetsForClinic();
  }, [clinicId]);

  // convert "HH:mm" or "HH:mm:ss" into minutes since midnight
  function timeToMinutes(t) {
    if (!t) return null;
    const mm = (t || "").slice(0,5); // "HH:mm"
    const [hh, min] = mm.split(":").map((v) => Number(v ?? 0));
    if (Number.isNaN(hh) || Number.isNaN(min)) return null;
    return hh * 60 + min;
  }

  // Check date/time against clinic schedules (backend uses 1=Mon .. 7=Sun)
  function isTimeWithinSchedule(dateStr, timeStr) {
    if (!dateStr || !timeStr || !schedules || schedules.length === 0) return false;
    const d = new Date(dateStr);
    const jsDay = d.getDay(); // 0 = Sun .. 6 = Sat
    const dayIndex = jsDay === 0 ? 7 : jsDay; // map JS Sunday 0 -> backend 7
    const tMin = timeToMinutes(timeStr);
    if (tMin == null) return false;
    return schedules.some((s) => {
      const w = s.weekday == null ? null : Number(s.weekday);
      if (w !== dayIndex) return false;
      const openMin = timeToMinutes(s.openTime || s.open || s.startTime);
      const closeMin = timeToMinutes(s.closeTime || s.close || s.endTime);
      if (openMin == null || closeMin == null) return false;
      return tMin >= openMin && tMin <= closeMin;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!petId) return setError("Select one of your pets.");
    if (!clinicId) return setError("Select a clinic.");
    if (!date || !time) return setError("Choose date and time.");
    if (!isTimeWithinSchedule(date, time)) return setError("Selected time is outside clinic working hours.");
    setSaving(true);
    try {
      const payload = {
        petId: Number(petId),
        clinicId: Number(clinicId),
        // include vetId if selected, otherwise null
        vetId: vetId ? Number(vetId) : null,
        date,
        time,
        reason
      };
      const res = await api.post("/api/appointments", payload);
      setSaving(false);
      if (onCreated) onCreated(res.data);
    } catch (e) {
      setSaving(false);
      setError(e?.response?.data?.error || e.message || "Failed to create appointment");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 720, padding: 18, background:"#fff", borderRadius:8, margin: "0 auto" }}>
      <h3>Request appointment</h3>

      <label>Clinic</label>
      <select value={clinicId} onChange={e => setClinicId(e.target.value)}>
        <option value="">Choose clinic</option>
        {clinics.map(c => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}
      </select>

      <label>Vet (optional)</label>
      <select value={vetId} onChange={e => setVetId(e.target.value)}>
        <option value="">No preference</option>
        {vets.length === 0 ? (
          <option value="" disabled>{clinicId ? "No vets listed for this clinic" : "Select a clinic first"}</option>
        ) : (
          vets.map(v => (
            <option key={v.id} value={v.id}>
              {v.title ? `${v.title} ` : ""}Dr. {v.firstName} {v.lastName}{v.specialty ? ` — ${v.specialty}` : ""}
            </option>
          ))
        )}
      </select>

      <label>Your pet</label>
      <select value={petId} onChange={e => setPetId(e.target.value)}>
        <option value="">Choose pet</option>
        {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
      </select>

      <label>Date</label>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} />

      <label>Time</label>
      <input type="time" value={time} onChange={e => setTime(e.target.value)} />

      {schedules && schedules.length > 0 && (
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>
          Clinic hours:
          <ul style={{ marginTop: 6, marginBottom: 6, paddingLeft: 18 }}>
            {schedules
              .slice()
              .sort((a,b)=> (Number(a.weekday||1) - Number(b.weekday||1)))
              .map(s => {
                const idx = (Number(s.weekday) || 1) - 1;
                const dayLabel = WEEKDAY_NAMES[idx] ?? `Day ${s.weekday}`;
                const open = (s.openTime || s.open || s.startTime || "").slice(0,5) || "-";
                const close = (s.closeTime || s.close || s.endTime || "").slice(0,5) || "-";
                return (
                  <li key={s.id}>
                    <strong style={{ display: "inline-block", width: 110 }}>{dayLabel}</strong>
                    {open} — {close}
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Reason</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={4}
          style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e6edf3" }}
        />
      </div>

      {error && <div style={{ color: "#b91c1c", marginTop: 8 }}>{error}</div>}

      <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
        <button
          type="submit"
          className="po-btn"
          style={{ padding: "12px 18px", minWidth: 180 }}
          disabled={saving}
        >
          {saving ? "Requesting…" : "Request appointment"}
        </button>
        <Link to="/dashboard" className="po-btn-outline" style={{ padding: "10px 14px" }}>
          Cancel
        </Link>
      </div>
    </form>
  );
}