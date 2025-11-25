package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Clinic;
import com.vetsecure.backend.repository.ClinicRepository;
import com.vetsecure.backend.web.dto.ClinicDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/clinics")
public class ClinicSelfController {

    private final ClinicRepository clinics;

    public ClinicSelfController(ClinicRepository clinics) {
        this.clinics = clinics;
    }

    // Public list of clinics (defaults to APPROVED)
    @GetMapping
    public ResponseEntity<List<ClinicDTO>> listPublic(
            @RequestParam(required = false) Clinic.Status status
    ) {
        Clinic.Status effectiveStatus = status != null ? status : Clinic.Status.APPROVED;
        var list = clinics.findByStatus(effectiveStatus).stream().map(ClinicDTO::from).toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ClinicDTO>> myClinics(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        String email = auth.getName();
        var list = clinics.findByClinicAdminEmailIgnoreCase(email)
                .stream()
                .map(ClinicDTO::from)
                .toList();
        return ResponseEntity.ok(list);
    }
}
