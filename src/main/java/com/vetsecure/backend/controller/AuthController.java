package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public static class LoginRequest {
        public String usernameOrEmail;
        public String password;
        public String getUsernameOrEmail() { return usernameOrEmail; }
        public String getPassword() { return password; }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request == null || request.usernameOrEmail == null || request.password == null) {
            return ResponseEntity.badRequest().body("Missing credentials");
        }

        User user = userRepository
                .findByUsernameOrEmail(request.usernameOrEmail, request.usernameOrEmail)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        // Compare using BCrypt
        if (!passwordEncoder.matches(request.password, user.getPasswordHash())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("token", "devtoken");
        body.put("user", user);
        return ResponseEntity.ok(body);
    }
}


