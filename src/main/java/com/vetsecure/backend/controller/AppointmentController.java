package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Appointment;
import com.vetsecure.backend.model.Appointment.AppointmentStatus;
import com.vetsecure.backend.service.AppointmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    /**
     * Create a new appointment
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createAppointment(@Valid @RequestBody AppointmentRequest request) {
        try {
            Appointment appointment = appointmentService.createAppointment(
                    request.vetId(),
                    request.petId(),
                    request.date(),
                    request.time(),
                    request.reason()
            );
            return ResponseEntity.ok(appointment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to create appointment", "message", e.getMessage()));
        }
    }

    /**
     * Get appointment by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id) {
        try {
            Appointment appointment = appointmentService.getAppointmentById(id);
            return ResponseEntity.ok(appointment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all appointments for a vet
     */
    @GetMapping("/vet/{vetId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Appointment>> getAppointmentsByVetId(@PathVariable Long vetId) {
        List<Appointment> appointments = appointmentService.getAppointmentsByVetId(vetId);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Get all appointments for a pet
     */
    @GetMapping("/pet/{petId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Appointment>> getAppointmentsByPetId(@PathVariable Long petId) {
        List<Appointment> appointments = appointmentService.getAppointmentsByPetId(petId);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Get all appointments for a pet owner
     */
    @GetMapping("/owner/{ownerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Appointment>> getAppointmentsByOwnerId(@PathVariable Long ownerId) {
        List<Appointment> appointments = appointmentService.getAppointmentsByPetOwnerId(ownerId);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Get all appointments for a clinic
     */
    @GetMapping("/clinic/{clinicId}")
    @PreAuthorize("hasAnyAuthority('SCOPE_CLINIC_ADMIN', 'SCOPE_SUPER_ADMIN')")
    public ResponseEntity<List<Appointment>> getAppointmentsByClinicId(@PathVariable Long clinicId) {
        List<Appointment> appointments = appointmentService.getAppointmentsByClinicId(clinicId);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Get appointments by vet and date
     */
    @GetMapping("/vet/{vetId}/date/{date}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Appointment>> getAppointmentsByVetIdAndDate(
            @PathVariable Long vetId,
            @PathVariable String date
    ) {
        LocalDate localDate = LocalDate.parse(date);
        List<Appointment> appointments = appointmentService.getAppointmentsByVetIdAndDate(vetId, localDate);
        return ResponseEntity.ok(appointments);
    }

    /**
     * Update appointment status
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('SCOPE_CLINIC_ADMIN', 'SCOPE_VET')")
    public ResponseEntity<?> updateAppointmentStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        try {
            AppointmentStatus status = AppointmentStatus.valueOf(request.get("status"));
            Appointment appointment = appointmentService.updateAppointmentStatus(id, status);
            return ResponseEntity.ok(appointment);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to update status", "message", e.getMessage()));
        }
    }

    /**
     * Complete appointment with diagnosis and prescription
     */
    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyAuthority('SCOPE_CLINIC_ADMIN', 'SCOPE_VET')")
    public ResponseEntity<?> completeAppointment(
            @PathVariable Long id,
            @RequestBody CompleteAppointmentRequest request
    ) {
        try {
            Appointment appointment = appointmentService.completeAppointment(
                    id,
                    request.diagnosis(),
                    request.prescription()
            );
            return ResponseEntity.ok(appointment);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to complete appointment", "message", e.getMessage()));
        }
    }

    /**
     * Cancel an appointment
     */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id) {
        try {
            Appointment appointment = appointmentService.cancelAppointment(id);
            return ResponseEntity.ok(appointment);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to cancel appointment", "message", e.getMessage()));
        }
    }

    /**
     * Update appointment
     */
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateAppointment(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentRequest request
    ) {
        try {
            Appointment appointment = appointmentService.updateAppointment(
                    id,
                    request.date(),
                    request.time(),
                    request.reason()
            );
            return ResponseEntity.ok(appointment);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to update appointment", "message", e.getMessage()));
        }
    }

    /**
     * Delete an appointment (admin only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SCOPE_SUPER_ADMIN')")
    public ResponseEntity<?> deleteAppointment(@PathVariable Long id) {
        try {
            appointmentService.deleteAppointment(id);
            return ResponseEntity.ok(Map.of("message", "Appointment deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to delete appointment", "message", e.getMessage()));
        }
    }

    // Request DTOs
    public record AppointmentRequest(
            Long vetId,
            Long petId,
            LocalDate date,
            LocalTime time,
            String reason
    ) {}

    public record UpdateAppointmentRequest(
            LocalDate date,
            LocalTime time,
            String reason
    ) {}

    public record CompleteAppointmentRequest(
            String diagnosis,
            String prescription
    ) {}
}

