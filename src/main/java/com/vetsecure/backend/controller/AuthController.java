package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.UserRepository;
import com.vetsecure.backend.security.JwtService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;

record LoginRequest(String email, String password) {}
record TokenResponse(String token) {}                         // <-- unchanged
record MfaChallengeResponse(boolean mfaRequired, String mfaToken, long expiresInSeconds) {}
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final AuthenticationManager authManager;
    private final JwtService jwt;
    private final UserRepository users;                       // <-- NEW

    public AuthController(AuthenticationManager am, JwtService jwt, UserRepository users) {
        this.authManager = am;
        this.jwt = jwt;
        this.users = users;                                   // <-- NEW
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            logger.info("Login attempt for identifier={}", req.email());

            // Resolve identifier: allow users to sign in with username OR email.
            String identifier = req.email();
            String principalForAuth = identifier; // default: use what client sent

            // If identifier doesn't look like an email, try to resolve by username or email
            if (!identifier.contains("@")) {
                var uOpt = users.findByUsernameOrEmail(identifier, identifier);
                if (uOpt.isPresent()) {
                    principalForAuth = uOpt.get().getEmail();
                    logger.debug("Resolved login identifier '{}' -> email='{}'", identifier, principalForAuth);
                } else {
                    // leave principalForAuth as-is (will likely fail authentication)
                    logger.debug("Login identifier '{}' did not resolve to a user", identifier);
                }
            }

            // 1) password auth (use resolved principal — our UserDetailsService expects an email)
            authManager.authenticate(new UsernamePasswordAuthenticationToken(principalForAuth, req.password()));

            // 2) load user to check MFA (and to mint tokens)
            User u = users.findByEmail(principalForAuth).orElse(null);
            if (u == null) {
                logger.warn("Login failed: user not found for principal={}", principalForAuth);
                return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
            }

            // 3) if MFA is enabled, return short-lived mfaToken (no final token yet)
            if (u.isMfaEnabled()) {
                String mfaToken = jwt.generateMfaToken(u.getId());     // requires updated JwtService
                return ResponseEntity.ok(new MfaChallengeResponse(true, mfaToken, 120));
            }

            // 4) MFA OFF: preserve old behavior exactly -> { "token": "<jwt>" }
            return ResponseEntity.ok(new TokenResponse(jwt.generateAccessToken(u)));

        } catch (AuthenticationException e) {
            logger.warn("Authentication failed for email={}: {}", req.email(), e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
    }
}
