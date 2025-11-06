package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Pet;
import com.vetsecure.backend.model.PetOwner;
import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.PetOwnerRepository;
import com.vetsecure.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/pet-owners")
public class PetOwnerController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PetOwnerRepository petOwnerRepository;

    @GetMapping
    public List<PetOwner> getAllPetOwners() {
        return petOwnerRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<PetOwner> getPetOwner(@PathVariable Long id) {
        return petOwnerRepository.findById(id);
    }

    @PostMapping
    @Transactional
    public PetOwner createPetOwner(@Valid @RequestBody PetOwner po) {
        // 1. Load the existing user from DB
        User existingUser = userRepository.findById(po.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Attach the user to PetOwner
        po.setUser(existingUser);

        // 3. Save PetOwner (Hibernate now knows user already exists)
        return petOwnerRepository.save(po);
    }

    @PutMapping("/{id}")
    public PetOwner updatePetOwner(@PathVariable Long id, @Valid @RequestBody PetOwner ownerDetails) {
        PetOwner owner = petOwnerRepository.findById(id).orElseThrow();
        owner.setFirstName(ownerDetails.getFirstName());
        owner.setLastName(ownerDetails.getLastName());
        owner.setPhone(ownerDetails.getPhone());
        owner.setPets(ownerDetails.getPets());
        return petOwnerRepository.save(owner);
    }

    @DeleteMapping("/{id}")
    public void deletePetOwner(@PathVariable Long id) {
        petOwnerRepository.deleteById(id);
    }
}