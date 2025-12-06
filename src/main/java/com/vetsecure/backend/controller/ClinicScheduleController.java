package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.ClinicSchedule;
import com.vetsecure.backend.service.ClinicScheduleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/clinic-schedules")
public class ClinicScheduleController {

    private final ClinicScheduleService clinicScheduleService;

    public ClinicScheduleController(ClinicScheduleService clinicScheduleService) {
        this.clinicScheduleService = clinicScheduleService;
    }

    /**
     * Create a new clinic schedule
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('SCOPE_CLINIC_ADMIN', 'SCOPE_SUPER_ADMIN')")
    public ResponseEntity<?> createSchedule(@Valid @RequestBody ScheduleRequest request) {
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
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getScheduleById(@PathVariable Long id) {
        try {
            ClinicSchedule schedule = clinicScheduleService.getScheduleById(id);
            return ResponseEntity.ok(schedule);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all schedules for a clinic
     */
    @GetMapping("/clinic/{clinicId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ClinicSchedule>> getSchedulesByClinicId(@PathVariable Long clinicId) {
        List<ClinicSchedule> schedules = clinicScheduleService.getSchedulesByClinicId(clinicId);
        return ResponseEntity.ok(schedules);
    }

    /**
     * Get schedules for a clinic by weekday
     */
    @GetMapping("/clinic/{clinicId}/weekday/{weekday}")
    @PreAuthorize("isAuthenticated()")
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
    @PreAuthorize("hasAnyAuthority('SCOPE_CLINIC_ADMIN', 'SCOPE_SUPER_ADMIN')")
    public ResponseEntity<?> updateSchedule(
            @PathVariable Long id,
            @Valid @RequestBody UpdateScheduleRequest request
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
    @PreAuthorize("hasAnyAuthority('SCOPE_CLINIC_ADMIN', 'SCOPE_SUPER_ADMIN')")
    public ResponseEntity<?> deleteSchedule(@PathVariable Long id) {
        try {
            clinicScheduleService.deleteSchedule(id);
            return ResponseEntity.ok(Map.of("message", "Schedule deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to delete schedule", "message", e.getMessage()));
        }
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

