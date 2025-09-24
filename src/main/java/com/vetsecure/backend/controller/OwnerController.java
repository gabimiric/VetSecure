package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.PetOwner;
import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.PetOwnerRepository;
import com.vetsecure.backend.repository.UserRepository;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/owners")
public class OwnerController {

    private final PetOwnerRepository owners;
    private final UserRepository users;

    public OwnerController(PetOwnerRepository owners, UserRepository users) {
        this.owners = owners;
        this.users = users;
    }

    @GetMapping
    public List<PetOwner> all() {
        return owners.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PetOwner> one(@PathVariable Long id) {
        return owners.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Create a PetOwner for the currently authenticated user */
    @PostMapping("/me")
    public ResponseEntity<?> createForCurrentUser(
            @RequestParam @NotBlank String firstName,
            @RequestParam @NotBlank String lastName,
            @RequestParam(required = false) String phone,
            org.springframework.security.core.Authentication auth
    ) {
        String email = auth.getName();  // email from JWT

        if (owners.existsByUser_EmailIgnoreCase(email)) {
            return ResponseEntity.badRequest().body("You already have a Pet Owner profile");
        }

        User user = users.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + email));

        PetOwner po = new PetOwner();
        po.setUser(user); // @MapsId ties PetOwner.id to User.id
        po.setFirstName(firstName);
        po.setLastName(lastName);
        po.setPhone(phone);

        PetOwner saved = owners.save(po);
        return ResponseEntity.created(URI.create("/api/owners/" + saved.getId()))
                .body(saved);
    }
}
