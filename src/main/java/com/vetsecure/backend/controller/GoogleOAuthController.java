package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.UserRepository;
import com.vetsecure.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * OAuth gateway for Google login with MFA support.
 * Receives Google ID token, validates it, checks user MFA status, and returns appropriate tokens.
 */
@Profile("google")
@RestController
@RequestMapping("/api/auth/google")
public class GoogleOAuthController {

    private final JwtDecoder jwtDecoder;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Value("${app.security.google.client-id}")
    private String googleClientId;

    public GoogleOAuthController(
            @Lazy JwtDecoder jwtDecoder,
            UserRepository userRepository,
            JwtService jwtService
    ) {
        this.jwtDecoder = jwtDecoder;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    /**
     * Login with Google ID token.
     * 
     * @param request containing idToken from Google OAuth
     * @return MFA challenge if MFA enabled, or full access/refresh tokens if not
     */
    @PostMapping("/login")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleLoginRequest request) {
        try {
            // 1. Validate Google ID token
            Jwt jwt = jwtDecoder.decode(request.idToken());
            
            // 2. Extract email from Google token
            String email = jwt.getClaim("email");
            if (email == null || email.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Email not found in Google token"));
            }

            // 3. Find or create user
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not registered. Please contact administrator."));
            }

            // 4. Check if MFA is enabled
            if (user.isMfaEnabled()) {
                // Return short-lived MFA token (2 minutes)
                String mfaToken = jwtService.generateMfaToken(user.getId());
                return ResponseEntity.ok(new GoogleMfaChallengeResponse(
                        true,
                        mfaToken,
                        120  // expires in 120 seconds
                ));
            }

            // 5. MFA not enabled - return full access + refresh tokens
            String accessToken = jwtService.generateAccessToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);
            
            return ResponseEntity.ok(new GoogleTokenResponse(accessToken, refreshToken));

        } catch (JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid Google ID token: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Login failed: " + e.getMessage()));
        }
    }
}

// Request/Response records specific to Google OAuth
record GoogleLoginRequest(String idToken) {}
record GoogleMfaChallengeResponse(boolean mfaRequired, String mfaToken, long expiresInSeconds) {}
record GoogleTokenResponse(String accessToken, String refreshToken) {}
