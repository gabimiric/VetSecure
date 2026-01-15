import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppointmentForm from "../../components/AppointmentForm";

export default function NewAppointmentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const clinicId = params.get("clinicId") ?? undefined;
  const petId = params.get("petId") ?? undefined;

  return (
    <div
      style={{
        minHeight: "calc(100vh - 72px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 920 }}>
        <h1 style={{ marginBottom: 12 }}>Request an appointment</h1>
        <AppointmentForm
          initialClinicId={clinicId}
          initialPetId={petId}
          onCreated={() => {
            navigate("/dashboard");
          }}
        />
      </div>
    </div>
  );
}