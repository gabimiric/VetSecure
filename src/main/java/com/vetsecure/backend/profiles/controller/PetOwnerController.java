package com.vetsecure.backend.profiles.controller;

import com.vetsecure.backend.profiles.domain.PetOwner;
import com.vetsecure.backend.profiles.repo.PetOwnerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PetOwnerController {
    @Autowired
    private PetOwnerRepository petOwnerRepository;

    @PostMapping("/petowner")
    PetOwner newPetOwner(@RequestBody PetOwner newPetOwner) {
        return petOwnerRepository.save(newPetOwner);
    }
}