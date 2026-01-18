package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Clinic;
import com.vetsecure.backend.repository.ClinicRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/clinics")
public class ClinicController {

    @Autowired
    private ClinicRepository clinicRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Clinic> getAllClinics() {
        return clinicRepository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Optional<Clinic> getClinic(@PathVariable Long id) {
        return clinicRepository.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CLINIC_ADMIN', 'SUPER_ADMIN')")
    public Clinic createClinic(@Valid @RequestBody Clinic clinic) {
        clinic.setStatus(Clinic.Status.PENDING);
        return clinicRepository.save(clinic);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Clinic approveClinic(@PathVariable Long id) {
        Clinic clinic = clinicRepository.findById(id).orElseThrow();
        clinic.setStatus(Clinic.Status.APPROVED);
        return clinicRepository.save(clinic);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Clinic rejectClinic(@PathVariable Long id) {
        Clinic clinic = clinicRepository.findById(id).orElseThrow();
        clinic.setStatus(Clinic.Status.REJECTED);
        return clinicRepository.save(clinic);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public void deleteClinic(@PathVariable Long id) {
        clinicRepository.deleteById(id);
    }

    /**
     * Update clinic description
     */
    @PatchMapping("/{id}/description")
    @PreAuthorize("hasAnyRole('CLINIC_ADMIN', 'SUPER_ADMIN')")
    public Clinic updateDescription(
            @PathVariable Long id,
            @RequestBody UpdateDescriptionRequest request
    ) {
        Clinic clinic = clinicRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Clinic not found"));
        clinic.setDescription(request.description());
        return clinicRepository.save(clinic);
    }

    /**
     * Update clinic logo URL
     * Frontend uploads image to Cloudinary first, then sends URL to this endpoint
     */
    @PatchMapping("/{id}/logo")
    @PreAuthorize("hasAnyRole('CLINIC_ADMIN', 'SUPER_ADMIN')")
    public Clinic updateLogo(
            @PathVariable Long id,
            @RequestBody UpdateLogoRequest request
    ) {
        Clinic clinic = clinicRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Clinic not found"));
        clinic.setLogoUrl(request.logoUrl());
        return clinicRepository.save(clinic);
    }

    /**
     * Update clinic image URL (for real-life picture of clinic)
     * Frontend uploads image to Cloudinary first, then sends URL to this endpoint
     */
    @PatchMapping("/{id}/image")
    @PreAuthorize("hasAnyRole('CLINIC_ADMIN', 'SUPER_ADMIN')")
    public Clinic updateClinicImage(
            @PathVariable Long id,
            @RequestBody UpdateClinicImageRequest request
    ) {
        Clinic clinic = clinicRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Clinic not found"));
        clinic.setClinicImageUrl(request.clinicImageUrl());
        return clinicRepository.save(clinic);
    }

    // Request DTOs
    public record UpdateDescriptionRequest(String description) {}
    public record UpdateLogoRequest(String logoUrl) {}
    public record UpdateClinicImageRequest(String clinicImageUrl) {}
}