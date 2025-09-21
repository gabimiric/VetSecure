package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Vet;
import com.vetsecure.backend.repository.VetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/vets")
public class VetController {

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
    public Vet createVet(@RequestBody Vet vet) {
        return vetRepository.save(vet);
    }

    @PutMapping("/{id}")
    public Vet updateVet(@PathVariable Long id, @RequestBody Vet vetDetails) {
        Vet vet = vetRepository.findById(id).orElseThrow();
        vet.setFirstName(vetDetails.getFirstName());
        vet.setLastName(vetDetails.getLastName());
        vet.setLicense(vetDetails.getLicense());
        vet.setRole(vetDetails.getRole());
        vet.setClinic(vetDetails.getClinic());
        return vetRepository.save(vet);
    }

    @DeleteMapping("/{id}")
    public void deleteVet(@PathVariable Long id) {
        vetRepository.deleteById(id);
    }
}
