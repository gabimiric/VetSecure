import React, { useState } from "react";
import "./OwnerForm.css";

export default function OwnerForm() {
    const [form, setForm] = useState({
        name: "", email: "", phone: "", address: ""
    });
    const [status, setStatus] = useState(null);

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setStatus("saving");
        try {
            const res = await fetch("/api/owners", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify(form)
            });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to save");
            }
            const saved = await res.json();
            setStatus("ok");
            setForm({ name:"", email:"", phone:"", address:"" });
            console.log("Saved owner:", saved);
        } catch (err) {
            console.error(err);
            setStatus("error:" + err.message);
        }
    };

    return (
        <div className="screen">
            <div className="card">
                <h1 className="title">Register Pet Owner</h1>
                <form onSubmit={submit}>
                    <label className="label">Full name</label>
                    <input className="tf" name="name" value={form.name} onChange={onChange} placeholder="Jane Doe" />

                    <label className="label">Email</label>
                    <input className="tf" name="email" value={form.email} onChange={onChange} placeholder="jane@example.com" type="email" />

                    <label className="label">Phone</label>
                    <input className="tf" name="phone" value={form.phone} onChange={onChange} placeholder="+40 7xx xxx xxx" />

                    <label className="label">Address</label>
                    <input className="tf" name="address" value={form.address} onChange={onChange} placeholder="Street, No., City" />

                    <button className="primary" disabled={status === "saving"}>
                        {status === "saving" ? "Saving…" : "Save Owner"}
                    </button>
                    {status && status.startsWith("error") && (
                        <div className="error">{status.replace("error:", "")}</div>
                    )}
                    {status === "ok" && <div className="success">Saved!</div>}
                </form>
            </div>
        </div>
    );
}