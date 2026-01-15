// src/pages/ClinicApply.jsx
import React, { useState } from 'react';
import { postClinicRequest } from '../api/client';

const initial = {
    clinicName: '',
    address: '',
    city: '',
    phone: '',
    adminName: '',
    adminEmail: '',
};

export default function ClinicApply() {
  const [form, setForm] = React.useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    setError(null);
    try {
      // send only minimal clinic request fields
      const saved = await postClinicRequest(form);
      setSuccess(`Request #${saved.id} submitted! Status: ${saved.status || "PENDING"}`);
      setForm(initial);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '32px auto', padding: 16 }}>
      <h2>Apply your clinic</h2>
      <form onSubmit={onSubmit}>
          <label>
              Clinic name*<br/>
              <input
                  name="clinicName"
                  value={form.clinicName}
                  onChange={onChange}
                  maxLength={160}
                  required
              />
          </label>
          <br /><br />

          <label>
              Address*<br/>
              <input
                  name="address"
                  value={form.address}
                  onChange={onChange}
                  maxLength={255}
                  required
              />
          </label>
          <br /><br />

          <label>
              City<br/>
              <input
                  name="city"
                  value={form.city}
                  onChange={onChange}
                  maxLength={120}
              />
          </label>
          <br /><br />

          <label>
              Phone<br/>
              <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  maxLength={40}
              />
          </label>
          <br /><br />

          <label>
              Admin name*<br/>
              <input
                  name="adminName"
                  value={form.adminName}
                  onChange={onChange}
                  maxLength={120}
                  required
              />
          </label>
          <br /><br />

          <label>
              Admin email*<br/>
              <input
                  name="adminEmail"
                  type="email"
                  value={form.adminEmail}
                  onChange={onChange}
                  maxLength={190}
                  required
              />
          </label>

          <br />

          <button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit request'}
          </button>
      </form>
    </div>
  );
}