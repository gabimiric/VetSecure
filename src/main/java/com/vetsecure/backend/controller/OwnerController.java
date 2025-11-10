package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.PetOwner;
import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.PetOwnerRepository;
import com.vetsecure.backend.repository.UserRepository;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    /** List all owners – clinic staff/admin/vet/assistant (hierarchy allows SUPER_ADMIN too) */
    @GetMapping
    @PreAuthorize("hasAnyRole('CLINIC_ADMIN','VET','ASSISTANT','SUPER_ADMIN')")
    public List<PetOwner> all() {
        return owners.findAll();
    }

    /** Get one owner – allowed to clinic staff/admin/vet/assistant OR the owner themself */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLINIC_ADMIN','VET','ASSISTANT','SUPER_ADMIN') or @authz.isSelfOwner(authentication, #id)")
    public ResponseEntity<PetOwner> one(@PathVariable Long id) {
        return owners.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Get owner for current authenticated user (by email in JWT) */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> me(org.springframework.security.core.Authentication auth) {
        String email = auth.getName();
        return owners.findByUser_EmailIgnoreCase(email)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Create a PetOwner for the current user – only if they don't already have one */
    @PostMapping("/me")
    @PreAuthorize("@authz.canCreateOwnerForSelf(authentication)")
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
