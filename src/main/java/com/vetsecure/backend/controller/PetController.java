package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Pet;
import com.vetsecure.backend.repository.PetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/pets")
public class PetController {

    @Autowired
    private PetRepository petRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('SCOPE_pets:read')")
    public List<Pet> getAllPets() {
        return petRepository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SCOPE_pets:read')")
    public Optional<Pet> getPet(@PathVariable Long id) {
        return petRepository.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('SCOPE_pets:write')")
    public Pet createPet(@Valid @RequestBody Pet pet) {
        return petRepository.save(pet);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SCOPE_pets:write')")
    public Pet updatePet(@PathVariable Long id, @Valid @RequestBody Pet petDetails) {
        Pet pet = petRepository.findById(id).orElseThrow();
        pet.setName(petDetails.getName());
        pet.setSpecies(petDetails.getSpecies());
        pet.setBreed(petDetails.getBreed());
        pet.setGender(petDetails.getGender());
        pet.setWeight(petDetails.getWeight());
        pet.setDateOfBirth(petDetails.getDateOfBirth());
        pet.setOwner(petDetails.getOwner());
        return petRepository.save(pet);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SCOPE_pets:write')")
    public void deletePet(@PathVariable Long id) {
        petRepository.deleteById(id);
    }
}