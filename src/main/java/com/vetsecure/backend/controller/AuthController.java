package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.UserRepository;
import com.vetsecure.backend.security.JwtService;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

record LoginRequest(String email, String password) {}
record TokenResponse(String token) {}                         // <-- unchanged
record MfaChallengeResponse(boolean mfaRequired, String mfaToken, long expiresInSeconds) {}
@Profile("!oauth")
@RestController
@RequestMapping("/api/auth")
public class AuthController {
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
            // 1) password auth (same as before)
            authManager.authenticate(new UsernamePasswordAuthenticationToken(req.email(), req.password()));

            // 2) load user to check MFA (and to mint tokens)
            User u = users.findByEmail(req.email()).orElse(null);
            if (u == null) return ResponseEntity.status(401).build();

            // 3) if MFA is enabled, return short-lived mfaToken (no final token yet)
            if (u.isMfaEnabled()) {
                String mfaToken = jwt.generateMfaToken(u.getId());     // requires updated JwtService
                return ResponseEntity.ok(new MfaChallengeResponse(true, mfaToken, 120));
            }

            // 4) MFA OFF: preserve old behavior exactly -> { "token": "<jwt>" }
            return ResponseEntity.ok(new TokenResponse(jwt.generateAccessToken(u)));

        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).build();
        }
    }
}
