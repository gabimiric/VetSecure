package com.vetsecure.backend.web.dto;

import com.vetsecure.backend.model.Clinic;
import java.time.Instant;

public class ClinicDTO {
    public Long id;
    public String name;
    public String address;
    public String city;
    public String phone;
    public String email;
    public Clinic.Status status;
    public Instant createdAt;
    public Long clinicAdminId;
    public String clinicAdminEmail;

    public static ClinicDTO from(Clinic c) {
        var dto = new ClinicDTO();
        dto.id = c.getId();
        dto.name = c.getName();
        dto.address = c.getAddress();
        dto.city = c.getCity();
        dto.phone = c.getPhone();
        dto.email = c.getEmail();
        dto.status = c.getStatus();
        dto.createdAt = c.getCreatedAt();
        if (c.getClinicAdmin() != null) {
            dto.clinicAdminId = c.getClinicAdmin().getId();
            dto.clinicAdminEmail = c.getClinicAdmin().getEmail();
        }
        return dto;
    }
}
