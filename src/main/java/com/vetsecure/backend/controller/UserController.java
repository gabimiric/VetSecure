package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @authz.isSelf(authentication, #id)")
    public Optional<User> getUser(@PathVariable Long id) {
        return userRepository.findById(id);
    }

    /** GET /users/me - Get current authenticated user */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<User> getCurrentUser(org.springframework.security.core.Authentication auth) {
        String email = auth.getName(); // email from JWT
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    @PostMapping
    public User createUser(@Valid @RequestBody User user, org.springframework.security.core.Authentication auth) {
        // If authenticated, require SUPER_ADMIN role for creating users
        if (auth != null && auth.isAuthenticated()) {
            boolean isSuperAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
            if (!isSuperAdmin) {
                throw new org.springframework.security.access.AccessDeniedException(
                    "Only SUPER_ADMIN can create users when authenticated");
            }
        }
        // If not authenticated, allow registration (public endpoint)

        if (user.getPasswordHash() != null && !user.getPasswordHash().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        }
        return userRepository.save(user);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN') or @authz.isSelf(authentication, #id)")
    public User updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        User user = userRepository.findById(id).orElseThrow();
        user.setUsername(userDetails.getUsername());
        user.setEmail(userDetails.getEmail());
        if (userDetails.getPasswordHash() != null && !userDetails.getPasswordHash().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(userDetails.getPasswordHash()));
        }
        // Only SUPER_ADMIN can change roles
        if (org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"))) {
            user.setRole(userDetails.getRole());
        }
        return userRepository.save(user);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public void deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
    }

    /**
     * Update user profile picture URL
     * Frontend uploads image to Cloudinary first, then sends URL to this endpoint
     */
    @PatchMapping("/{id}/profile-picture")
    @PreAuthorize("@authz.isSelf(authentication, #id) or hasRole('SUPER_ADMIN')")
    public ResponseEntity<User> updateProfilePicture(
            @PathVariable Long id,
            @RequestBody UpdateProfilePictureRequest request
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setProfilePictureUrl(request.imageUrl());
        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(updatedUser);
    }

    // Request DTO
    public record UpdateProfilePictureRequest(String imageUrl) {}
}