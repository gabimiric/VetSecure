package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Clinic;
import com.vetsecure.backend.service.AdminClinicService;
import com.vetsecure.backend.web.dto.ClinicDTO;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/admin/clinics")
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CLINIC_ADMIN')")
public class AdminClinicController {

    private final AdminClinicService service;

    public AdminClinicController(AdminClinicService service) {
        this.service = service;
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
}