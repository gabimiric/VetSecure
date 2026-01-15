package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.Clinic;
import com.vetsecure.backend.model.ClinicRequest;
import com.vetsecure.backend.model.ClinicSchedule;
import com.vetsecure.backend.repository.ClinicRepository;
import com.vetsecure.backend.repository.ClinicRequestRepository;
import com.vetsecure.backend.repository.ClinicScheduleRepository;
import com.vetsecure.backend.web.dto.ClinicDTO;
import com.vetsecure.backend.web.dto.ClinicRequestDTO;
import com.vetsecure.backend.web.dto.ClinicScheduleDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api/clinics")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class ClinicPublicController {

    private static final Logger log = LoggerFactory.getLogger(ClinicPublicController.class);

    private final ClinicRepository clinicRepository;
    private final ClinicRequestRepository repo;
    private final com.vetsecure.backend.repository.UserRepository userRepository;
    private final ClinicScheduleRepository clinicScheduleRepository;

    public ClinicPublicController(ClinicRepository clinicRepository,
                                  ClinicRequestRepository repo,
                                  com.vetsecure.backend.repository.UserRepository userRepository,
                                  ClinicScheduleRepository clinicScheduleRepository) {
        this.clinicRepository = clinicRepository;
        this.repo = repo;
        this.userRepository = userRepository;
        this.clinicScheduleRepository = clinicScheduleRepository;
    }

    @PostMapping
    @org.springframework.web.bind.annotation.CrossOrigin
    @org.springframework.security.access.prepost.PreAuthorize("permitAll()") // Allow POST without authentication
    public ResponseEntity<ClinicRequest> submit(@Valid @RequestBody ClinicRequest body,
                                                Authentication auth) {
        try {
            // If user is authenticated, ALWAYS override adminName and adminEmail from the authenticated user
            // This ensures we use the actual username from the database, not what the client sends
            if (auth != null && auth.isAuthenticated()) {
                String userEmail = auth.getName(); // email from JWT
                // Fetch the actual user from database to get the real username
                java.util.Optional<com.vetsecure.backend.model.User> userOpt = userRepository.findByEmail(userEmail);
                if (userOpt.isPresent()) {
                    com.vetsecure.backend.model.User user = userOpt.get();
                    // Override adminName with actual username from database
                    body.setAdminName(user.getUsername());
                    body.setAdminEmail(user.getEmail());
                    System.out.println("[ClinicRequest] Authenticated user - Overriding adminName to: " + user.getUsername() + " for email: " + user.getEmail());
                } else {
                    System.err.println("[ClinicRequest] WARNING: Authenticated user email '" + userEmail + "' not found in database!");
                }
            } else {
                System.out.println("[ClinicRequest] Unauthenticated request - using client-provided adminName: " + body.getAdminName());
            }

            // Ensure requests always start as PENDING (even if client sends another value)
            body.setStatus(ClinicRequest.Status.PENDING);
            // Ensure decidedAt and decidedBy are null for new requests
            body.setDecidedAt(null);
            body.setDecidedBy(null);
            ClinicRequest saved = repo.save(body);

            // Mirror the request into the clinics table so super-admins can approve there
            userRepository.findByEmail(body.getAdminEmail()).ifPresentOrElse(user -> {
                Clinic clinic = clinicRepository.findByClinicAdminEmailIgnoreCase(user.getEmail())
                        .stream().findFirst().orElse(new Clinic());
                clinic.setClinicAdmin(user);
                clinic.setName(body.getClinicName());
                clinic.setAddress(body.getAddress());
                clinic.setCity(body.getCity());
                clinic.setPhone(body.getPhone());
                clinic.setEmail(body.getAdminEmail());
                clinic.setStatus(Clinic.Status.PENDING);
                clinicRepository.save(clinic);
            }, () -> {
                System.err.println("[ClinicRequest] No user found for adminEmail=" + body.getAdminEmail());
            });
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            // Log the error for debugging
            System.err.println("Error saving clinic request: " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-throw to let Spring handle it
        }
    }

    /**
     * OLD: @GetMapping("/me")  <-- collides with ClinicSelfController#myClinics
     * New: expose clinic requests under /api/clinics/requests/me to avoid path collision
     */
    @GetMapping("/requests/me")
    public ResponseEntity<?> getMyRequests(Authentication auth, HttpServletRequest req) {
        try {
            System.out.println("[ClinicRequest] ===== GET /api/clinic-requests/me called =====");
            System.out.println("[ClinicRequest] Request URI: " + req.getRequestURI());
            System.out.println("[ClinicRequest] Authorization header: " + req.getHeader("Authorization"));
            System.out.println("[ClinicRequest] Authentication object: " + (auth != null ? "present" : "null"));
            System.out.println("[ClinicRequest] Is authenticated: " + (auth != null && auth.isAuthenticated()));

            // Check SecurityContext directly as fallback
            org.springframework.security.core.Authentication contextAuth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            System.out.println("[ClinicRequest] SecurityContext auth: " + (contextAuth != null ? "present" : "null"));
            if (contextAuth != null) {
                System.out.println("[ClinicRequest] SecurityContext isAuthenticated: " + contextAuth.isAuthenticated());
                System.out.println("[ClinicRequest] SecurityContext principal: " + contextAuth.getPrincipal());
            }

            // Use contextAuth if auth parameter is null
            if (auth == null) {
                auth = contextAuth;
            }

            if (auth == null || !auth.isAuthenticated()) {
                System.err.println("[ClinicRequest] ERROR: Not authenticated! Returning 401");
                return ResponseEntity.status(401).body(java.util.Collections.emptyList());
            }

            String userEmail = auth.getName(); // email from JWT
            System.out.println("[ClinicRequest] ===== GET /api/clinic-requests/me =====");
            System.out.println("[ClinicRequest] Authentication object: " + auth);
            System.out.println("[ClinicRequest] User email from JWT: " + userEmail);
            System.out.println("[ClinicRequest] Is authenticated: " + auth.isAuthenticated());

            // Fetch the user to get the actual username from database
            java.util.Optional<com.vetsecure.backend.model.User> userOpt = userRepository.findByEmail(userEmail);
            if (userOpt.isPresent()) {
                com.vetsecure.backend.model.User user = userOpt.get();
                String username = user.getUsername();
                System.out.println("[ClinicRequest] User found in DB:");
                System.out.println("  - ID: " + user.getId());
                System.out.println("  - Username: '" + username + "'");
                System.out.println("  - Email: " + user.getEmail());

                // Match by username (adminName) - trim and normalize
                String normalizedUsername = username != null ? username.trim() : "";
                System.out.println("[ClinicRequest] Querying: findByAdminNameIgnoreCase('" + normalizedUsername + "')");

                // First, get ALL requests to see what we have
                List<ClinicRequest> allRequests = repo.findAll();
                System.out.println("[ClinicRequest] Total requests in DB: " + allRequests.size());
                System.out.println("[ClinicRequest] Searching for username: '" + normalizedUsername + "'");
                for (ClinicRequest cr : allRequests) {
                    boolean matches = normalizedUsername.equalsIgnoreCase(cr.getAdminName());
                    System.out.println("  - Request ID: " + cr.getId() +
                            ", admin_name: '" + cr.getAdminName() +
                            "', admin_email: " + cr.getAdminEmail() +
                            ", MATCHES: " + matches);
                }

                // Try JPA query first
                List<ClinicRequest> requests = repo.findByAdminNameIgnoreCase(normalizedUsername);
                System.out.println("[ClinicRequest] JPA query found " + requests.size() + " requests by username");

                // If empty, use manual filter (more reliable)
                if (requests.isEmpty()) {
                    System.out.println("[ClinicRequest] JPA query returned empty, using manual filter...");
                    requests = allRequests.stream()
                            .filter(cr -> {
                                String reqAdminName = cr.getAdminName() != null ? cr.getAdminName().trim() : "";
                                boolean matches = normalizedUsername.equalsIgnoreCase(reqAdminName);
                                if (matches) {
                                    System.out.println("[ClinicRequest] Manual filter matched: Request ID " + cr.getId());
                                }
                                return matches;
                            })
                            .collect(java.util.stream.Collectors.toList());
                    System.out.println("[ClinicRequest] Manual filter found " + requests.size() + " requests");
                }

                // Also try by email as fallback and log for debugging
                List<ClinicRequest> requestsByEmail = repo.findByAdminEmailIgnoreCase(userEmail);
                System.out.println("[ClinicRequest] Found " + requestsByEmail.size() + " requests by email: " + userEmail);

                // If no requests found by username, try email as fallback
                if (requests.isEmpty() && !requestsByEmail.isEmpty()) {
                    System.out.println("[ClinicRequest] Using email-based results as fallback");
                    requests = requestsByEmail;
                }

                List<ClinicRequestDTO> dtos = requests.stream()
                        .map(ClinicRequestDTO::fromEntity)
                        .collect(Collectors.toList());

                System.out.println("[ClinicRequest] Returning " + dtos.size() + " DTOs");
                System.out.println("[ClinicRequest] ===== END GET /me =====");
                return ResponseEntity.ok(dtos);
            } else {
                // Fallback: try by email if user not found (shouldn't happen, but just in case)
                System.err.println("[ClinicRequest] WARNING: User not found for email: " + userEmail);
                List<ClinicRequest> requests = repo.findByAdminEmailIgnoreCase(userEmail);
                System.out.println("[ClinicRequest] Fallback: Found " + requests.size() + " requests by email");
                List<ClinicRequestDTO> dtos = requests.stream()
                        .map(ClinicRequestDTO::fromEntity)
                        .collect(Collectors.toList());
                return ResponseEntity.ok(dtos);
            }
        } catch (Exception e) {
            System.err.println("[ClinicRequest] ERROR in getMyRequests: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Add: GET /api/clinics/{id} — public read (fallback for frontend)
    @GetMapping("/{id}")
    public ResponseEntity<com.vetsecure.backend.web.dto.ClinicDTO> getClinicById(@PathVariable Long id) {
        return clinicRepository.findById(id)
                .map(clinic -> ResponseEntity.ok(ClinicDTO.from(clinic)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * PUT /api/clinics/{id}
     * Allow clinic admin (owner) or SUPER_ADMIN to update clinic basic info.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateClinic(@PathVariable Long id,
                                          @RequestBody ClinicUpdateDto dto,
                                          Authentication auth) {
        return clinicRepository.findById(id).map(clinic -> {
            String currentUser = auth != null ? auth.getName() : null;
            boolean isSuperAdmin = auth != null && auth.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority()) || "SUPER_ADMIN".equals(a.getAuthority()));

            // Owner check: only when clinic.getClinicAdmin() is present we compare; otherwise require SUPER_ADMIN
            boolean isOwner = false;
            if (currentUser != null && clinic.getClinicAdmin() != null) {
                try {
                    var admin = clinic.getClinicAdmin();
                    if (admin.getEmail() != null && currentUser.equalsIgnoreCase(admin.getEmail())) isOwner = true;
                    if (!isOwner && admin.getUsername() != null && currentUser.equalsIgnoreCase(admin.getUsername()))
                        isOwner = true;
                    if (!isOwner && admin.getId() != null && currentUser.equals(String.valueOf(admin.getId())))
                        isOwner = true;
                } catch (Exception ignored) {}
            }

            if (!isOwner && !isSuperAdmin) {
                return ResponseEntity.status(403).build();
            }

            if (dto.getName() != null) clinic.setName(dto.getName());
            if (dto.getAddress() != null) clinic.setAddress(dto.getAddress());
            if (dto.getCity() != null) clinic.setCity(dto.getCity());
            if (dto.getPhone() != null) clinic.setPhone(dto.getPhone());
            if (dto.getEmail() != null) clinic.setEmail(dto.getEmail());
            if (dto.getDescription() != null) clinic.setDescription(dto.getDescription());

            clinicRepository.save(clinic);
            return ResponseEntity.ok(ClinicDTO.from(clinic));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // DTO for update payload
    public static class ClinicUpdateDto {
        private String name;
        private String address;
        private String city;
        private String phone;
        private String email;
        private String description;
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    // GET /api/clinics/{id}/schedules - return schedules for a clinic (public/read)
    @GetMapping("/{id}/schedules")
    public ResponseEntity<?> getClinicSchedules(@PathVariable Long id, HttpServletRequest request) {
        try {
            log.info("GET /api/clinics/{}/schedules called from origin: {}", id, request.getHeader("Origin"));
            List<ClinicSchedule> rows = clinicScheduleRepository.findByClinicId(id);
            List<ClinicScheduleDTO> dtos = (rows == null ? List.<ClinicSchedule>of() : rows)
                    .stream()
                    .map(ClinicScheduleDTO::from)
                    .collect(Collectors.toList());
            log.info("Returning {} schedule DTOs for clinic {}", dtos.size(), id);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error in getClinicSchedules for id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to load schedules"));
        }
    }
}
