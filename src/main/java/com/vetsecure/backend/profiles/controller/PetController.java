package com.vetsecure.backend.profiles.controller;

import com.vetsecure.backend.profiles.domain.Pet;
import com.vetsecure.backend.profiles.repo.PetOwnerRepository;
import com.vetsecure.backend.profiles.domain.PetOwner;
import com.vetsecure.backend.profiles.repo.PetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class PetController {
    @Autowired
    private PetRepository petRepo;

    @Autowired
    private PetOwnerRepository ownerRepo;

    // Create a pet and link it to an existing owner
    @PostMapping("/with-owner/{ownerId}")
    public Pet addPetToOwner(@PathVariable UUID ownerId, @RequestBody Pet pet) {
        // Find the owner
        PetOwner owner = ownerRepo.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        // Link the pet to the owner
        owner.addPet(pet);

        // Save owner (cascade will save the pet too)
        ownerRepo.save(owner);

        return pet;
    }
}