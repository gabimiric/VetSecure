package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Clinic;
import com.vetsecure.backend.repository.ClinicRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
    public List<Clinic> getAllClinics() {
        return clinicRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Clinic> getClinic(@PathVariable Long id) {
        return clinicRepository.findById(id);
    }

    @PostMapping
    public Clinic createClinic(@Valid @RequestBody Clinic clinic) {
        clinic.setStatus(Clinic.Status.PENDING);
        return clinicRepository.save(clinic);
    }

    @PutMapping("/{id}/approve")
    public Clinic approveClinic(@PathVariable Long id) {
        Clinic clinic = clinicRepository.findById(id).orElseThrow();
        clinic.setStatus(Clinic.Status.APPROVED);
        return clinicRepository.save(clinic);
    }

    @PutMapping("/{id}/reject")
    public Clinic rejectClinic(@PathVariable Long id) {
        Clinic clinic = clinicRepository.findById(id).orElseThrow();
        clinic.setStatus(Clinic.Status.REJECTED);
        return clinicRepository.save(clinic);
    }

    @DeleteMapping("/{id}")
    public void deleteClinic(@PathVariable Long id) {
        clinicRepository.deleteById(id);
    }

    /**
     * Update clinic description
     */
    @PatchMapping("/{id}/description")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('SCOPE_CLINIC_ADMIN', 'SCOPE_SUPER_ADMIN')")
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
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('SCOPE_CLINIC_ADMIN', 'SCOPE_SUPER_ADMIN')")
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
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('SCOPE_CLINIC_ADMIN', 'SCOPE_SUPER_ADMIN')")
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