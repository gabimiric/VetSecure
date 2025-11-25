import { api } from "../services/http";

export async function listClinicRequests(status = "PENDING") {
    const res = await api.get(`/api/admin/clinic-requests?status=${encodeURIComponent(status)}`);
    return res.data;
}

export async function approveClinicRequest(id) {
    const res = await api.post(`/api/admin/clinic-requests/${id}/approve`);
    return res.data;
}

export async function rejectClinicRequest(id) {
    const res = await api.post(`/api/admin/clinic-requests/${id}/reject`);
    return res.data;
}

export async function listClinics(status) {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const res = await api.get(`/api/admin/clinics${query}`);
    return res.data;
}

export async function approveClinic(id) {
    const res = await api.post(`/api/admin/clinics/${id}/approve`);
    return res.data;
}

export async function rejectClinic(id) {
    const res = await api.post(`/api/admin/clinics/${id}/reject`);
    return res.data;
}
