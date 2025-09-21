package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.PetOwner;
import com.vetsecure.backend.repository.PetOwnerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/pet-owners")
public class PetOwnerController {

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
    public PetOwner createPetOwner(@RequestBody PetOwner petOwner) {
        return petOwnerRepository.save(petOwner);
    }

    @PutMapping("/{id}")
    public PetOwner updatePetOwner(@PathVariable Long id, @RequestBody PetOwner ownerDetails) {
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
