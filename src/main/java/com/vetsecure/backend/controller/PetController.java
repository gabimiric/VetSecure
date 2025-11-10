package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Pet;
import com.vetsecure.backend.model.PetOwner;
import com.vetsecure.backend.repository.PetOwnerRepository;
import com.vetsecure.backend.repository.PetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
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

    @Autowired
    private PetOwnerRepository ownerRepository;

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
    @PreAuthorize("isAuthenticated()")
    public Pet createPet(@RequestBody Pet pet, Authentication auth) {
        // If caller is a PET_OWNER and owner is missing or not set correctly,
        // resolve the PetOwner by the authenticated user's email.
        if (pet.getOwner() == null || pet.getOwner().getId() == null) {
            if (auth != null && auth.isAuthenticated()) {
                String email = auth.getName();
                Optional<PetOwner> po = ownerRepository.findByUser_EmailIgnoreCase(email);
                po.ifPresent(pet::setOwner);
            }
        }
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