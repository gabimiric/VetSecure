package com.vetsecure.backend.web.dto;

import com.vetsecure.backend.model.Clinic;

import java.time.Instant;

public class ClinicDTO {
    private Long id;
    private String name;
    private String address;
    private String city;
    private String phone;
    private String email;
    private Clinic.Status status;
    private Instant createdAt;
    private String description;
    // optional clinic admin info
    private Long clinicAdminId;
    private String clinicAdminEmail;

    // getters / setters
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getAddress() {
        return address;
    }
    public void setAddress(String address) {
        this.address = address;
    }
    public String getCity() {
        return city;
    }
    public void setCity(String city) {
        this.city = city;
    }
    public String getPhone() {
        return phone;
    }
    public void setPhone(String phone) {
        this.phone = phone;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public Clinic.Status getStatus() {
        return status;
    }
    public void setStatus(Clinic.Status status) {
        this.status = status;
    }
    public Instant getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getClinicAdminId() { return clinicAdminId; }
    public void setClinicAdminId(Long clinicAdminId) { this.clinicAdminId = clinicAdminId; }
    public String getClinicAdminEmail() { return clinicAdminEmail; }
    public void setClinicAdminEmail(String clinicAdminEmail) { this.clinicAdminEmail = clinicAdminEmail; }

    public static ClinicDTO from(Clinic c) {
        ClinicDTO dto = new ClinicDTO();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setAddress(c.getAddress());
        dto.setCity(c.getCity());
        dto.setPhone(c.getPhone());
        dto.setEmail(c.getEmail());
        dto.setStatus(c.getStatus());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setDescription(c.getDescription());
        if (c.getClinicAdmin() != null) {
            try {
                dto.setClinicAdminId(c.getClinicAdmin().getId());
                dto.setClinicAdminEmail(c.getClinicAdmin().getEmail());
            } catch (Exception ignored) {}
        }
        return dto;
    }
}
