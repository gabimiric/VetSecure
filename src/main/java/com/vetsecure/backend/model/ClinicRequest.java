package com.vetsecure.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "clinic_requests")
public class ClinicRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(max = 160)
    @Column(name = "clinic_name")
    private String clinicName;

    @NotBlank @Size(max = 255)
    private String address;

    @Size(max = 120)
    private String city;

    @Size(max = 40)
    private String phone;

    @NotBlank @Size(max = 120)
    @Column(name = "admin_name")
    private String adminName;

    @NotBlank @Email @Size(max = 190)
    @Column(name = "admin_email")
    private String adminEmail;

    @NotNull
    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    public enum Status { PENDING, APPROVED, REJECTED }

    // --- getters & setters ---
    public Long getId() { return id; }

    public String getClinicName() { return clinicName; }
    public void setClinicName(String clinicName) { this.clinicName = clinicName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAdminName() { return adminName; }
    public void setAdminName(String adminName) { this.adminName = adminName; }

    public String getAdminEmail() { return adminEmail; }
    public void setAdminEmail(String adminEmail) { this.adminEmail = adminEmail; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
}