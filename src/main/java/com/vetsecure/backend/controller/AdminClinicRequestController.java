package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.ClinicRequest;
import com.vetsecure.backend.service.AdminClinicRequestService;
import com.vetsecure.backend.web.dto.ClinicRequestDTO;
import jakarta.validation.constraints.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/clinic-requests")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminClinicRequestController {

    private final AdminClinicRequestService service;

    public AdminClinicRequestController(AdminClinicRequestService service) {
        this.service = service;
    }

    /** GET /api/admin/clinic-requests?status=PENDING */
    @GetMapping
    public ResponseEntity<List<ClinicRequestDTO>> list(
            @RequestParam(required = false) ClinicRequest.Status status) {

        List<ClinicRequestDTO> list = service.list(status).stream()
                .map(ClinicRequestDTO::fromEntity)
                .collect(Collectors.toList()); // <-- works on Java 8+
        return ResponseEntity.ok(list);
    }

    /** GET /api/admin/clinic-requests/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<ClinicRequestDTO> get(@PathVariable @Min(1) Long id) {
        var req = service.get(id);
        return ResponseEntity.ok(ClinicRequestDTO.fromEntity(req));
    }

    /** POST /api/admin/clinic-requests/{id}/approve */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ClinicRequestDTO> approve(@PathVariable Long id, Authentication auth) {
        String adminIdentifier = auth.getName(); // email/username from JWT
        var updated = service.approve(id, adminIdentifier);
        return ResponseEntity.ok(ClinicRequestDTO.fromEntity(updated));
    }

    /** POST /api/admin/clinic-requests/{id}/reject */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ClinicRequestDTO> reject(@PathVariable Long id, Authentication auth) {
        String adminIdentifier = auth.getName();
        var updated = service.reject(id, adminIdentifier);
        return ResponseEntity.ok(ClinicRequestDTO.fromEntity(updated));
    }
}