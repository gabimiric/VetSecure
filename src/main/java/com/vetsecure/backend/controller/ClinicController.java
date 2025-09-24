package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Clinic;
import com.vetsecure.backend.repository.ClinicRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

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
    public Clinic createClinic(@RequestBody Clinic clinic) {
        clinic.setStatus(Clinic.Status.PENDING); // default new requests to PENDING
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
}