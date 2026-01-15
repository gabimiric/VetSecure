package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Clinic;
import com.vetsecure.backend.model.ClinicSchedule;
import com.vetsecure.backend.repository.ClinicRepository;
import com.vetsecure.backend.repository.ClinicScheduleRepository;
import com.vetsecure.backend.service.ClinicScheduleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clinic-schedules")
public class ClinicScheduleController {

    private final ClinicScheduleRepository clinicScheduleRepository;
    private final ClinicRepository clinicRepository;
    private final ClinicScheduleService clinicScheduleService;

    public ClinicScheduleController(ClinicScheduleRepository clinicScheduleRepository,
                                    ClinicRepository clinicRepository,
                                    ClinicScheduleService clinicScheduleService) {
        this.clinicScheduleRepository = clinicScheduleRepository;
        this.clinicRepository = clinicRepository;
        this.clinicScheduleService = clinicScheduleService;
    }

    /**
     * Create a new clinic schedule
     */
    @PostMapping
    public ResponseEntity<?> createSchedule(@RequestBody ScheduleRequest request) {
        try {
            ClinicSchedule schedule = clinicScheduleService.createSchedule(
                    request.clinicId(),
                    request.weekday(),
                    request.openTime(),
                    request.closeTime()
            );
            return ResponseEntity.ok(schedule);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to create schedule", "message", e.getMessage()));
        }
    }

    /**
     * Get schedule by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getScheduleById(@PathVariable Long id) {
        try {
            ClinicSchedule schedule = clinicScheduleService.getScheduleById(id);
            return ResponseEntity.ok(schedule);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all schedules for a clinic (path-based)
     */
    @GetMapping("/clinic/{clinicId}")
    public ResponseEntity<List<ClinicSchedule>> getSchedulesByClinicId(@PathVariable Long clinicId) {
        List<ClinicSchedule> schedules = clinicScheduleService.getSchedulesByClinicId(clinicId);
        return ResponseEntity.ok(schedules);
    }

    /**
     * Get schedules for a clinic by weekday
     */
    @GetMapping("/clinic/{clinicId}/weekday/{weekday}")
    public ResponseEntity<List<ClinicSchedule>> getSchedulesByClinicIdAndWeekday(
            @PathVariable Long clinicId,
            @PathVariable Byte weekday
    ) {
        List<ClinicSchedule> schedules = clinicScheduleService.getSchedulesByClinicIdAndWeekday(clinicId, weekday);
        return ResponseEntity.ok(schedules);
    }

    /**
     * Update a clinic schedule
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSchedule(
            @PathVariable Long id,
            @RequestBody UpdateScheduleRequest request
    ) {
        try {
            ClinicSchedule schedule = clinicScheduleService.updateSchedule(
                    id,
                    request.weekday(),
                    request.openTime(),
                    request.closeTime()
            );
            return ResponseEntity.ok(schedule);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to update schedule", "message", e.getMessage()));
        }
    }

    /**
     * Delete a clinic schedule
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSchedule(@PathVariable Long id) {
        try {
            clinicScheduleService.deleteSchedule(id);
            return ResponseEntity.ok(Map.of("message", "Schedule deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to delete schedule", "message", e.getMessage()));
        }
    }

    // Generic list endpoint that supports query ?clinicId=1 (frontend probe)
    @GetMapping
    public ResponseEntity<List<ClinicSchedule>> listSchedules(@RequestParam(required = false) Long clinicId) {
        if (clinicId != null) {
            List<ClinicSchedule> rows = clinicScheduleRepository.findByClinicId(clinicId);
            return ResponseEntity.ok(rows);
        } else {
            List<ClinicSchedule> all = clinicScheduleRepository.findAll();
            return ResponseEntity.ok(all);
        }
    }

    // Expose canonical endpoints frontend expects: GET /api/clinics/{id}/schedules
    @GetMapping(path = "/api/clinics/{id}/schedules")
    public ResponseEntity<List<ClinicSchedule>> listSchedulesForClinicPrimary(@PathVariable("id") Long id) {
        List<ClinicSchedule> rows = clinicScheduleRepository.findByClinicId(id);
        return ResponseEntity.ok(rows);
    }

    // PUT /api/clinics/{id}/schedules — replace schedules for clinic (owner or SUPER_ADMIN)
    @PutMapping(path = "/api/clinics/{id}/schedules")
    public ResponseEntity<?> replaceSchedulesForClinic(@PathVariable("id") Long id,
                                                       @RequestBody List<ScheduleDto> rows,
                                                       Authentication auth) {
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
                if (!isOwner && admin.getUsername() != null && currentUser.equalsIgnoreCase(admin.getUsername()))
                    isOwner = true;
                if (!isOwner && admin.getId() != null && currentUser.equals(String.valueOf(admin.getId()))) isOwner = true;
            } catch (Exception ignored) {
            }
        }

        if (!isOwner && !isSuperAdmin) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        // Delete existing schedules and insert new ones
        clinicScheduleRepository.deleteByClinicId(id);

        List<ClinicSchedule> toSave = rows.stream().map(r -> {
            ClinicSchedule cs = new ClinicSchedule();
            // try to set relation to clinic entity
            try {
                cs.setClinic(clinic);
            } catch (Throwable t) {
                // fallback to clinicId field if model uses that
                try {
                    var f = cs.getClass().getDeclaredField("clinicId");
                    f.setAccessible(true);
                    f.set(cs, clinic.getId());
                } catch (Exception ignored) {
                }
            }
            cs.setWeekday((byte) (r.getWeekday() & 0xFF));
            try {
                if (r.getOpenTime() != null && !r.getOpenTime().isEmpty())
                    cs.setOpenTime(LocalTime.parse(r.getOpenTime()));
            } catch (Exception ignored) {
            }
            try {
                if (r.getCloseTime() != null && !r.getCloseTime().isEmpty())
                    cs.setCloseTime(LocalTime.parse(r.getCloseTime()));
            } catch (Exception ignored) {
            }
            return cs;
        }).collect(Collectors.toList());

        List<ClinicSchedule> saved = clinicScheduleRepository.saveAll(toSave);
        return ResponseEntity.ok(saved);
    }

    // DTO for schedule rows incoming JSON
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

    // Request DTOs
    public record ScheduleRequest(
            Long clinicId,
            Byte weekday,
            LocalTime openTime,
            LocalTime closeTime
    ) {}

    public record UpdateScheduleRequest(
            Byte weekday,
            LocalTime openTime,
            LocalTime closeTime
    ) {}
}

