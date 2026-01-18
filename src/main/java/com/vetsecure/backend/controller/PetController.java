package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Pet;
import com.vetsecure.backend.model.PetOwner;
import com.vetsecure.backend.repository.PetOwnerRepository;
import com.vetsecure.backend.repository.PetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;

import java.lang.reflect.Method;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping({"/pets", "/api/pets"})
public class PetController {

    @Autowired
    private PetRepository petRepository;

    @Autowired
    private PetOwnerRepository ownerRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('VET', 'CLINIC_ADMIN', 'SUPER_ADMIN', 'ASSISTANT')")
    public List<Pet> getAllPets() {
        return petRepository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("@authz.canAccessPet(authentication, #id)")
    public ResponseEntity<?> getPet(@PathVariable Long id) {
        Optional<Pet> pet = petRepository.findById(id);
        if (pet.isEmpty()) return ResponseEntity.notFound().build();
        pet = petRepository.findById(id);

        // Build a minimal map of pet fields (no owner)
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", reflectiveGet(pet, "getId", "id"));
        m.put("name", reflectiveGet(pet, "getName", "name"));
        m.put("species", reflectiveGet(pet, "getSpecies", "species"));
        m.put("breed", reflectiveGet(pet, "getBreed", "breed"));
        m.put("sex", reflectiveGet(pet, "getSex", "sex"));
        m.put("age", reflectiveGet(pet, "getAge", "age"));
        m.put("microchip", reflectiveGet(pet, "getMicrochip", "microchip"));
        m.put("dateOfBirth", reflectiveGet(pet, "getDateOfBirth", "getBorn", "born", "dateOfBirth"));

        return ResponseEntity.ok(m);
    }

    private static Object reflectiveGet(Object target, String... candidateNames) {
        if (target == null || candidateNames == null) return null;
        Class<?> cls = target.getClass();
        for (String name : candidateNames) {
            try {
                // try zero-arg method first
                Method m = cls.getMethod(name);
                if (m != null) {
                    return m.invoke(target);
                }
            } catch (NoSuchMethodException ignored) {
                // try field access getter style fallback via method with "get" prefix if not provided
                try {
                    String alt = name;
                    if (!name.startsWith("get")) alt = "get" + Character.toUpperCase(name.charAt(0)) + name.substring(1);
                    Method m2 = cls.getMethod(alt);
                    if (m2 != null) return m2.invoke(target);
                } catch (Throwable ignored2) {
                }
            } catch (Throwable ignored) {
            }
        }
        return null;
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
    @PreAuthorize("@authz.canAccessPet(authentication, #id)")
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
    @PreAuthorize("@authz.canAccessPet(authentication, #id) or hasRole('SUPER_ADMIN')")
    public void deletePet(@PathVariable Long id) {
        petRepository.deleteById(id);
    }

    /** GET /pets/owner/{ownerId} - Get pets by owner ID */
    @GetMapping("/owner/{ownerId}")
    @PreAuthorize("@authz.isSelfOwner(authentication, #ownerId) or hasAnyRole('VET', 'CLINIC_ADMIN', 'SUPER_ADMIN', 'ASSISTANT')")
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