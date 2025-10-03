package com.vetsecure.backend.web.dto;

import com.vetsecure.backend.model.ClinicRequest;
import java.time.Instant;

public class ClinicRequestDTO {
    private Long id;
    private String clinicName;
    private String address;
    private String city;
    private String phone;
    private String adminName;
    private String adminEmail;
    private ClinicRequest.Status status;
    private Instant decidedAt;
    private String decidedBy;

    public ClinicRequestDTO(Long id, String clinicName, String address, String city, String phone,
                            String adminName, String adminEmail, ClinicRequest.Status status,
                            Instant decidedAt, String decidedBy) {
        this.id = id; this.clinicName = clinicName; this.address = address; this.city = city;
        this.phone = phone; this.adminName = adminName; this.adminEmail = adminEmail;
        this.status = status; this.decidedAt = decidedAt; this.decidedBy = decidedBy;
    }

    public static ClinicRequestDTO fromEntity(ClinicRequest e) {
        return new ClinicRequestDTO(
                e.getId(), e.getClinicName(), e.getAddress(), e.getCity(), e.getPhone(),
                e.getAdminName(), e.getAdminEmail(), e.getStatus(), e.getDecidedAt(), e.getDecidedBy()
        );
    }

    // getters (and setters if you need them) ...
    public Long getId() { return id; }
    public String getClinicName() { return clinicName; }
    public String getAddress() { return address; }
    public String getCity() { return city; }
    public String getPhone() { return phone; }
    public String getAdminName() { return adminName; }
    public String getAdminEmail() { return adminEmail; }
    public ClinicRequest.Status getStatus() { return status; }
    public Instant getDecidedAt() { return decidedAt; }
    public String getDecidedBy() { return decidedBy; }
}
