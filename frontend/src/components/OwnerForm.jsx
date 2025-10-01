import React, { useState } from "react";

export default function OwnerForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [status, setStatus] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch("/pet-owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("saved");
      setForm({ name: "", email: "", phone: "", address: "" });
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "32px auto" }}>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Register Pet Owner</h2>
      <form
        onSubmit={submit}
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <label style={{ display: "block", marginBottom: 8 }}>
          Full name
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            required
            style={inputStyle}
            placeholder="Jane Doe"
          />
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            style={inputStyle}
            placeholder="jane@example.com"
          />
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          Phone
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            style={inputStyle}
            placeholder="+1 555 000 000"
          />
        </label>

        <label style={{ display: "block", marginBottom: 16 }}>
          Address
          <input
            name="address"
            value={form.address}
            onChange={onChange}
            style={inputStyle}
            placeholder="City, Street 1"
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
          {status === "saving" ? "Saving..." : "Save Owner"}
        </button>

        {status === "saved" && (
          <p style={{ color: "green", marginTop: 12 }}>Saved!</p>
        )}
        {status === "error" && (
          <p style={{ color: "crimson", marginTop: 12 }}>Failed to save.</p>
        )}
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
