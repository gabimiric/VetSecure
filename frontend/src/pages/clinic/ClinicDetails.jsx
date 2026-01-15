import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../../api/client";

const cardStyle = {
  maxWidth: 960,
  margin: "20px auto",
  padding: 20,
  borderRadius: 8,
  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
  background: "#fff",
  fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
};

const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const metaStyle = { color: "#6b7280", marginTop: 6 };

export default function ClinicDetails() {
  const { id } = useParams();
  const [clinic, setClinic] = React.useState(null);
  const [schedules, setSchedules] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const cRes = await client.get(`/api/clinics/${id}`);
        setClinic(cRes.data);
      } catch (e) {
        console.error("[ClinicDetails] GET /api/clinics/" + id + " failed:", e);
        setErr(e);
      }

      try {
        const sRes = await client.get(`/api/clinics/${id}/schedules`);
        setSchedules(Array.isArray(sRes.data) ? sRes.data : []);
      } catch (e) {
        console.warn("[ClinicDetails] GET /api/clinics/" + id + "/schedules ->", e);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const weekdayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  function formatTime(t) {
    if (!t) return "-";
    return t.length >= 5 ? t.slice(0,5) : t;
  }

  const renderSchedule = () => {
    if (!schedules || schedules.length === 0) return <div style={{color:"#6b7280"}}>No schedule defined.</div>;
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, background:"#f8fafc", padding:8, borderRadius:6 }}>
          <div style={{ fontWeight:700 }}>Day</div>
          <div style={{ fontWeight:700 }}>Open</div>
          <div style={{ fontWeight:700 }}>Close</div>
        </div>
        <div>
          {schedules
            .slice()
            .sort((a,b)=> (a.weekday||0)-(b.weekday||0))
            .map(r => (
              <div key={r.id} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, padding:"10px 8px", borderBottom:"1px solid #eef2f7" }}>
                <div>{weekdayNames[(r.weekday||1)-1] || `Day ${r.weekday}`}</div>
                <div>{formatTime(r.openTime)}</div>
                <div>{formatTime(r.closeTime)}</div>
              </div>
            ))
          }
        </div>
      </div>
    );
  };

  const formatError = (e) => {
    if (!e) return null;
    if (typeof e === "string") return e;
    if (e?.message) return e.message;
    try { return JSON.stringify(e); } catch { return String(e); }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={cardStyle}>
        {loading ? (
          <div>Loading…</div>
        ) : err ? (
          <div style={{ color: "#c2410c" }}>Error loading clinic: {formatError(err)}</div>
        ) : clinic ? (
          <>
            <div style={headerStyle}>
              <div>
                <h1 style={{ margin: 0 }}>{clinic.name}</h1>
                <div style={metaStyle}>{clinic.address}{clinic.city ? ` • ${clinic.city}` : ""}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <button
                  type="button"
                  className="po-btn"
                  style={{ marginRight: 8, textDecoration: "none" }}
                  onClick={() => navigate(`/appointments/new?clinicId=${clinic.id}`)}
                >
                  Request appointment
                </button>
                <div style={{ fontWeight:700 }}>{clinic.status}</div>
                <div style={{ color:"#6b7280", fontSize:14 }}>{clinic.email}</div>
              </div>
            </div>

            {clinic.description ? (
              <section style={{ marginTop: 18 }}>
                <h3 style={{ marginBottom:6 }}>About</h3>
                <p style={{ color:"#374151", lineHeight:1.6 }}>{clinic.description}</p>
              </section>
            ) : null}

            <section style={{ marginTop: 18 }}>
              <h3 style={{ marginBottom:6 }}>Opening Hours</h3>
              {renderSchedule()}
            </section>
          </>
        ) : (
          <div>No clinic found.</div>
        )}
      </div>
    </div>
  );
}
