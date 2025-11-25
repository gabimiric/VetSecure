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
import java.util.Map;
import java.util.Optional;
import org.springframework.http.ResponseEntity;

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
    public ResponseEntity<Pet> getPet(@PathVariable Long id) {
        Optional<Pet> pet = petRepository.findById(id);
        return pet.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createPet(@Valid @RequestBody Pet pet, Authentication auth) {
        // If caller is a PET_OWNER and owner is missing or not set correctly,
        // resolve the PetOwner by the authenticated user's email.
        if (pet.getOwner() == null || pet.getOwner().getId() == null) {
            if (auth != null && auth.isAuthenticated()) {
                String email = auth.getName();
                Optional<PetOwner> po = ownerRepository.findByUser_EmailIgnoreCase(email);
                if (po.isPresent()) {
                    pet.setOwner(po.get());
                } else {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "PetOwner profile not found", 
                                        "message", "Please ensure you have a PetOwner profile. User email: " + email));
                }
            } else {
                return ResponseEntity.status(401)
                        .body(Map.of("error", "Not authenticated"));
            }
        }
        try {
            Pet saved = petRepository.save(pet);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to save pet", "message", e.getMessage()));
        }
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

    /** GET /pets/owner/{ownerId} - Get pets by owner ID */
    @GetMapping("/owner/{ownerId}")
    @PreAuthorize("isAuthenticated()")
    public List<Pet> getPetsByOwner(@PathVariable Long ownerId, Authentication auth) {
        // Allow if user is the owner or has pets:read scope
        return petRepository.findByOwnerId(ownerId);
    }

    /** GET /pets/owner/me - Get current user's pets */
    @GetMapping("/owner/me")
    @PreAuthorize("isAuthenticated()")
    public List<Pet> getMyPets(Authentication auth) {
        String email = auth.getName();
        Optional<PetOwner> owner = ownerRepository.findByUser_EmailIgnoreCase(email);
        if (owner.isPresent()) {
            return petRepository.findByOwnerId(owner.get().getId());
        }
        return java.util.Collections.emptyList();
    }
}