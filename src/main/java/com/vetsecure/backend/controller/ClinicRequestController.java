package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.ClinicRequest;
import com.vetsecure.backend.repository.ClinicRequestRepository;
import com.vetsecure.backend.repository.UserRepository;
import com.vetsecure.backend.web.dto.ClinicRequestDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/clinic-requests")
public class ClinicRequestController {

    private final ClinicRequestRepository repo;
    private final UserRepository userRepository;

    public ClinicRequestController(ClinicRequestRepository repo, UserRepository userRepository) {
        this.repo = repo;
        this.userRepository = userRepository;
    }

    /**
     * GET /api/clinic-requests/me
     * Returns clinic requests associated with the authenticated user (by username or email).
     */
    @GetMapping("/me")
    public ResponseEntity<List<ClinicRequestDTO>> myRequests(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String userEmail = auth.getName();
        var userOpt = userRepository.findByEmail(userEmail);
        List<ClinicRequest> requests;

        if (userOpt.isPresent()) {
            String username = userOpt.get().getUsername();
            // try by username first
            requests = repo.findByAdminNameIgnoreCase(username);
            if (requests == null || requests.isEmpty()) {
                // fallback to email
                requests = repo.findByAdminEmailIgnoreCase(userEmail);
            }
        } else {
            requests = repo.findByAdminEmailIgnoreCase(userEmail);
        }

        List<ClinicRequestDTO> dtos = (requests == null ? List.<ClinicRequest>of() : requests)
                .stream().map(ClinicRequestDTO::fromEntity).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}