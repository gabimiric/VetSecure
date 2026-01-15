package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Clinic;
import com.vetsecure.backend.model.ClinicSchedule;
import com.vetsecure.backend.repository.ClinicRepository;
import com.vetsecure.backend.repository.ClinicScheduleRepository;
import com.vetsecure.backend.service.AdminClinicService;
import com.vetsecure.backend.web.dto.ClinicDTO;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/clinics")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CLINIC_ADMIN')")
public class AdminClinicController {

    private final AdminClinicService service;
    private final ClinicRepository clinicRepository;
    private final ClinicScheduleRepository clinicScheduleRepository;

    public AdminClinicController(AdminClinicService service,
                                 ClinicRepository clinicRepository,
                                 ClinicScheduleRepository clinicScheduleRepository) {
        this.service = service;
        this.clinicRepository = clinicRepository;
        this.clinicScheduleRepository = clinicScheduleRepository;
    }

    // GET /api/admin/clinics?status=PENDING&after=2025-01-01T00:00:00Z (after is optional)
    @GetMapping
    public ResponseEntity<List<ClinicDTO>> list(
            @RequestParam(required = false) Clinic.Status status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant after) {
        var list = service.list(status, after).stream().map(ClinicDTO::from).toList();
        return ResponseEntity.ok(list);
    }

    // GET /api/admin/clinics/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ClinicDTO> get(@PathVariable Long id) {
        return ResponseEntity.ok(ClinicDTO.from(service.get(id)));
    }

    // POST /api/admin/clinics/{id}/approve
    @PostMapping("/{id}/approve")
    public ResponseEntity<ClinicDTO> approve(@PathVariable Long id) {
        return ResponseEntity.ok(ClinicDTO.from(service.approve(id)));
    }

    // POST /api/admin/clinics/{id}/reject
    @PostMapping("/{id}/reject")
    public ResponseEntity<ClinicDTO> reject(@PathVariable Long id) {
        return ResponseEntity.ok(ClinicDTO.from(service.reject(id)));
    }

    // -----------------------
    // New: update clinic (owner or SUPER_ADMIN)
    // -----------------------
    @PutMapping("/{id}")
    public ResponseEntity<?> updateClinic(@PathVariable Long id, @RequestBody ClinicUpdateDto dto, org.springframework.security.core.Authentication auth) {
        Optional<Clinic> oc = clinicRepository.findById(id);
        if (!oc.isPresent()) return ResponseEntity.notFound().build();

        Clinic clinic = oc.get();

        String currentUser = auth != null ? auth.getName() : null;
        boolean isSuperAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority()) || "SUPER_ADMIN".equals(a.getAuthority()));

        boolean isOwner = false;
        if (currentUser != null && clinic.getClinicAdmin() != null) {
            var admin = clinic.getClinicAdmin();
            // compare by email, username or id string (robust)
            try {
                if (admin.getEmail() != null && currentUser.equalsIgnoreCase(admin.getEmail())) isOwner = true;
                if (!isOwner && admin.getUsername() != null && currentUser.equalsIgnoreCase(admin.getUsername())) isOwner = true;
                if (!isOwner && admin.getId() != null && currentUser.equals(String.valueOf(admin.getId()))) isOwner = true;
            } catch (Exception ignored) {}
        }

        if (!isOwner && !isSuperAdmin) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        if (dto.getName() != null) clinic.setName(dto.getName());
        if (dto.getAddress() != null) clinic.setAddress(dto.getAddress());
        if (dto.getCity() != null) clinic.setCity(dto.getCity());
        if (dto.getPhone() != null) clinic.setPhone(dto.getPhone());
        if (dto.getEmail() != null) clinic.setEmail(dto.getEmail());
        if (dto.getDescription() != null) clinic.setDescription(dto.getDescription());

        clinicRepository.save(clinic);
        return ResponseEntity.ok(ClinicDTO.from(clinic));
    }

    // -----------------------
    // New: schedules endpoints for this clinic
    // -----------------------
    @GetMapping("/{id}/schedules")
    public ResponseEntity<List<ClinicSchedule>> getSchedules(@PathVariable Long id) {
        List<ClinicSchedule> rows = clinicScheduleRepository.findByClinicId(id);
        return ResponseEntity.ok(rows);
    }

    @PutMapping("/{id}/schedules")
    public ResponseEntity<?> replaceSchedules(@PathVariable Long id, @RequestBody List<ScheduleDto> rows, org.springframework.security.core.Authentication auth) {
        Optional<Clinic> oc = clinicRepository.findById(id);
        if (!oc.isPresent()) return ResponseEntity.notFound().build();

        Clinic clinic = oc.get();

        String currentUser = auth != null ? auth.getName() : null;
        boolean isSuperAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority()) || "SUPER_ADMIN".equals(a.getAuthority()));

        boolean isOwner = false;
        if (currentUser != null && clinic.getClinicAdmin() != null) {
            var admin = clinic.getClinicAdmin();
            try {
                if (admin.getEmail() != null && currentUser.equalsIgnoreCase(admin.getEmail())) isOwner = true;
                if (!isOwner && admin.getUsername() != null && currentUser.equalsIgnoreCase(admin.getUsername())) isOwner = true;
                if (!isOwner && admin.getId() != null && currentUser.equals(String.valueOf(admin.getId()))) isOwner = true;
            } catch (Exception ignored) {}
        }

        if (!isOwner && !isSuperAdmin) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        // delete existing schedules for this clinic, then insert supplied list
        clinicScheduleRepository.deleteByClinicId(id);

        List<ClinicSchedule> toSave = rows.stream().map(r -> {
            ClinicSchedule cs = new ClinicSchedule();
            // set relation to clinic entity (use setClinic if model maps Clinic)
            try {
                cs.setClinic(clinic);
            } catch (NoSuchMethodError e) {
                // fallback: try to set clinicId field via reflection if model uses clinicId
                try {
                    java.lang.reflect.Field f = cs.getClass().getDeclaredField("clinicId");
                    f.setAccessible(true);
                    f.set(cs, clinic.getId());
                } catch (Exception ignored) {
                    // ignore - repository.saveAll may still fail if mapping is incompatible
                }
            }

            cs.setWeekday((byte)(r.getWeekday() & 0xFF));
            try {
                if (r.getOpenTime() != null && !r.getOpenTime().isEmpty()) cs.setOpenTime(LocalTime.parse(r.getOpenTime()));
            } catch (Exception ignored) {}
            try {
                if (r.getCloseTime() != null && !r.getCloseTime().isEmpty()) cs.setCloseTime(LocalTime.parse(r.getCloseTime()));
            } catch (Exception ignored) {}
            return cs;
        }).collect(Collectors.toList());

        List<ClinicSchedule> saved = clinicScheduleRepository.saveAll(toSave);
        return ResponseEntity.ok(saved);
    }

    // DTOs
    public static class ClinicUpdateDto {
        private String name;
        private String address;
        private String city;
        private String phone;
        private String email;
        private String description;
        // getters/setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class ScheduleDto {
        private Long id;
        private Integer weekday;
        private String openTime;
        private String closeTime;
        // getters/setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Integer getWeekday() { return weekday; }
        public void setWeekday(Integer weekday) { this.weekday = weekday; }
        public String getOpenTime() { return openTime; }
        public void setOpenTime(String openTime) { this.openTime = openTime; }
        public String getCloseTime() { return closeTime; }
        public void setCloseTime(String closeTime) { this.closeTime = closeTime; }
    }
}