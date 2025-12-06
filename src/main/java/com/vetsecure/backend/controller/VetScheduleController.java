package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.VetSchedule;
import com.vetsecure.backend.service.VetScheduleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/vet-schedules")
public class VetScheduleController {

    private final VetScheduleService vetScheduleService;

    public VetScheduleController(VetScheduleService vetScheduleService) {
        this.vetScheduleService = vetScheduleService;
    }

    /**
     * Create a new vet schedule
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('SCOPE_CLINIC_ADMIN', 'SCOPE_SUPER_ADMIN')")
    public ResponseEntity<?> createSchedule(@Valid @RequestBody ScheduleRequest request) {
        try {
            VetSchedule schedule = vetScheduleService.createSchedule(
                    request.vetId(),
                    request.weekday(),
                    request.startTime(),
                    request.endTime()
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
            VetSchedule schedule = vetScheduleService.getScheduleById(id);
            return ResponseEntity.ok(schedule);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all schedules for a vet
     */
    @GetMapping("/vet/{vetId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<VetSchedule>> getSchedulesByVetId(@PathVariable Long vetId) {
        List<VetSchedule> schedules = vetScheduleService.getSchedulesByVetId(vetId);
        return ResponseEntity.ok(schedules);
    }

    /**
     * Get schedules for a vet by weekday
     */
    @GetMapping("/vet/{vetId}/weekday/{weekday}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<VetSchedule>> getSchedulesByVetIdAndWeekday(
            @PathVariable Long vetId,
            @PathVariable Byte weekday
    ) {
        List<VetSchedule> schedules = vetScheduleService.getSchedulesByVetIdAndWeekday(vetId, weekday);
        return ResponseEntity.ok(schedules);
    }

    /**
     * Get all schedules for vets in a clinic
     */
    @GetMapping("/clinic/{clinicId}")
    @PreAuthorize("hasAnyAuthority('SCOPE_CLINIC_ADMIN', 'SCOPE_SUPER_ADMIN')")
    public ResponseEntity<List<VetSchedule>> getSchedulesByClinicId(@PathVariable Long clinicId) {
        List<VetSchedule> schedules = vetScheduleService.getSchedulesByClinicId(clinicId);
        return ResponseEntity.ok(schedules);
    }

    /**
     * Update a vet schedule
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SCOPE_CLINIC_ADMIN', 'SCOPE_SUPER_ADMIN')")
    public ResponseEntity<?> updateSchedule(
            @PathVariable Long id,
            @Valid @RequestBody UpdateScheduleRequest request
    ) {
        try {
            VetSchedule schedule = vetScheduleService.updateSchedule(
                    id,
                    request.weekday(),
                    request.startTime(),
                    request.endTime()
            );
            return ResponseEntity.ok(schedule);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to update schedule", "message", e.getMessage()));
        }
    }

    /**
     * Delete a vet schedule
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SCOPE_CLINIC_ADMIN', 'SCOPE_SUPER_ADMIN')")
    public ResponseEntity<?> deleteSchedule(@PathVariable Long id) {
        try {
            vetScheduleService.deleteSchedule(id);
            return ResponseEntity.ok(Map.of("message", "Schedule deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to delete schedule", "message", e.getMessage()));
        }
    }

    // Request DTOs
    public record ScheduleRequest(
            Long vetId,
            Byte weekday,
            LocalTime startTime,
            LocalTime endTime
    ) {}

    public record UpdateScheduleRequest(
            Byte weekday,
            LocalTime startTime,
            LocalTime endTime
    ) {}
}

