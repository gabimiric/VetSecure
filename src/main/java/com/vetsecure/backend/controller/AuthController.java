package com.vetsecure.backend.controller;

import com.vetsecure.backend.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

record LoginRequest(String email, String password) {}
record TokenResponse(String token) {}

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authManager;
    private final JwtService jwt;

    public AuthController(AuthenticationManager am, JwtService jwt) {
        this.authManager = am; this.jwt = jwt;
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest req) {
        try {
            authManager.authenticate(new UsernamePasswordAuthenticationToken(req.email(), req.password()));
            return ResponseEntity.ok(new TokenResponse(jwt.generate(req.email())));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).build();
        }
    }
}
