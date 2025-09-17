import React, { useState } from "react";

export default function ClinicRequestForm() {
    const [form, setForm] = useState({
        clinicName: "",
        adminEmail: "",
        address: "",
        city: "",
        phone: "",
    });
    const [status, setStatus] = useState(null);

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setStatus("saving");
        try {
            const res = await fetch("/api/clinic-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error(await res.text());
            setStatus("saved");
            setForm({ clinicName: "", adminEmail: "", address: "", city: "", phone: "" });
        } catch (err) {
            console.error(err);
            setStatus("error");
        }
    };

    return (
        <div style={{ maxWidth: 640, margin: "32px auto" }}>
            <h2 style={{ fontSize: 24, marginBottom: 16 }}>Clinic Registration Request</h2>
            <form onSubmit={submit} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                <label style={{ display: "block", marginBottom: 8 }}>
                    Clinic name
                    <input
                        name="clinicName"
                        value={form.clinicName}
                        onChange={onChange}
                        required
                        style={inputStyle}
                        placeholder="Happy Paws Vet"
                    />
                </label>

                <label style={{ display: "block", marginBottom: 8 }}>
                    Admin email
                    <input
                        type="email"
                        name="adminEmail"
                        value={form.adminEmail}
                        onChange={onChange}
                        required
                        style={inputStyle}
                        placeholder="admin@clinic.com"
                    />
                </label>

                <label style={{ display: "block", marginBottom: 8 }}>
                    Phone
                    <input
                        name="phone"
                        value={form.phone}
                        onChange={onChange}
                        style={inputStyle}
                        placeholder="+373 ..."
                    />
                </label>

                <label style={{ display: "block", marginBottom: 8 }}>
                    City
                    <input
                        name="city"
                        value={form.city}
                        onChange={onChange}
                        style={inputStyle}
                        placeholder="Chisinau"
                    />
                </label>

                <label style={{ display: "block", marginBottom: 16 }}>
                    Address
                    <input
                        name="address"
                        value={form.address}
                        onChange={onChange}
                        style={inputStyle}
                        placeholder="Street & Number"
                    />
                </label>

                <button
                    type="submit"
                    disabled={status === "saving"}
                    style={{
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: "none",
                        color: "white",
                        fontWeight: 700,
                        background: "linear-gradient(180deg,#4f46e5,#3b82f6)",
                        cursor: "pointer",
                        width: "100%",
                    }}
                >
                    {status === "saving" ? "Sending..." : "Send Request"}
                </button>

                {status === "saved" && <p style={{ color: "green", marginTop: 12 }}>Request submitted!</p>}
                {status === "error" && <p style={{ color: "crimson", marginTop: 12 }}>Failed to submit.</p>}
            </form>
        </div>
    );
}

const inputStyle = {
    width: "100%",
    display: "block",
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    outline: "none",
};