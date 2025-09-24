package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.PetOwner;
import com.vetsecure.backend.repository.OwnerRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/owners")
public class OwnerController {
    private final OwnerRepository repo;
    public OwnerController(OwnerRepository repo) { this.repo = repo; }

    @GetMapping
    public List<PetOwner> all() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PetOwner> one(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody PetOwner petOwner) {
        if (repo.existsByEmail(petOwner.getEmail())) {
            return ResponseEntity.badRequest().body("Email already registered");
        }
        PetOwner saved = repo.save(petOwner);
        return ResponseEntity.created(URI.create("/api/owners/" + saved.getId()))
                .body(saved);
    }
}