package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Clinic;
import com.vetsecure.backend.model.User;
import com.vetsecure.backend.model.Vet;
import com.vetsecure.backend.repository.ClinicRepository;
import com.vetsecure.backend.repository.UserRepository;
import com.vetsecure.backend.repository.VetRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/vets")
public class VetController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClinicRepository clinicRepository;

    @Autowired
    private VetRepository vetRepository;

    @GetMapping
    public List<Vet> getAllVets() {
        return vetRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Vet> getVet(@PathVariable Long id) {
        return vetRepository.findById(id);
    }

    @PostMapping
    @Transactional
    public Vet createVet(@Valid @RequestBody Vet vet) {
        // Load and attach existing User
        User existingUser = userRepository.findById(vet.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Load existing clinic
        Clinic existingClinic = clinicRepository.findById(vet.getClinic().getId())
                .orElseThrow(() -> new RuntimeException("Clinic not found"));

        // Attach managed user & clinic
        vet.setUser(existingUser);
        vet.setClinic(existingClinic);

        return vetRepository.save(vet);
    }


    @PutMapping("/{id}")
    @Transactional
    public Vet updateVet(@PathVariable Long id, @Valid @RequestBody Vet vetDetails) {
        Vet vet = vetRepository.findById(id).orElseThrow();

        vet.setFirstName(vetDetails.getFirstName());
        vet.setLastName(vetDetails.getLastName());
        vet.setLicense(vetDetails.getLicense());
        vet.setRole(vetDetails.getRole());

        if (vetDetails.getClinic() != null) {
            Clinic clinic = clinicRepository.findById(vetDetails.getClinic().getId())
                    .orElseThrow(() -> new RuntimeException("Clinic not found"));
            vet.setClinic(clinic);
        }

        return vetRepository.save(vet);
    }

    @DeleteMapping("/{id}")
    public void deleteVet(@PathVariable Long id) {
        vetRepository.deleteById(id);
    }
}