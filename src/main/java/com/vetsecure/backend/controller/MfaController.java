package com.vetsecure.backend.controller;

import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.UserRepository;
import com.vetsecure.backend.security.JwtService;              // ✅ add
import com.vetsecure.backend.security.mfa.MfaService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;                                      // ✅ add
import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/auth/mfa")
public class MfaController {

    private static final Logger logger = LoggerFactory.getLogger(MfaController.class);

    private final UserRepository users;
    private final MfaService mfa;
    private final JwtService jwtService;                       // ✅ add
    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    // ✅ updated constructor to include JwtService
    public MfaController(UserRepository users, MfaService mfa, JwtService jwtService) {
        this.users = users;
        this.mfa = mfa;
        this.jwtService = jwtService;
    }

    // Helper: resolve userId from Authentication. Accept numeric subject or email username.
    private Long resolveUserId(Authentication auth) {
        if (auth == null) return null;
        String name = auth.getName();
        if (name == null) return null;
        // try numeric first
        try {
            return Long.valueOf(name);
        } catch (NumberFormatException ignored) {}

        // try looking up by email/username
        return users.findByEmail(name).map(User::getId)
                .or(() -> users.findByUsername(name).map(User::getId))
                .orElse(null);
    }

    /** Step 1: generate secret + QR (user must be logged in) */
    @PostMapping("/setup")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> setup(org.springframework.security.core.Authentication auth) throws Exception {
        Long userId = resolveUserId(auth);
        if (userId == null) {
            logger.warn("MFA setup: could not resolve userId from Authentication: {}", auth);
            return ResponseEntity.status(401).body(Map.of("error","Invalid authentication"));
        }
        User user = users.findById(userId).orElseThrow();
        logger.info("MFA setup requested for userId={}, email={}", userId, user.getEmail());

        try {
            String secret = mfa.generateSecret();
            String otpauth = mfa.buildOtpAuthUrl(user.getEmail(), secret);
            String qr = null;
            try {
                qr = mfa.qrPngBase64(user.getEmail(), secret, 256);
            } catch (Exception qrEx) {
                // Don't fail setup if generating PNG fails (headless environments, ZXing issues).
                logger.warn("Could not generate QR PNG for userId={}: {}", userId, qrEx.getMessage());
                qr = null; // QR omitted; client can use the otpauth URI or secret
            }

            List<String> rc = mfa.generateRecoveryCodesPlain();

            // Set both secret and recovery codes, then save once
            user.setMfaSecret(secret);
            user.setMfaRecoveryHashes(mfa.hashRecoveryCodesForStorage(rc));
            users.save(user);

            logger.info("MFA setup completed for userId={}", userId);

            return ResponseEntity.ok(Map.of(
                    "secret", secret,
                    "otpauth", otpauth,
                    "qr", qr,
                    "recoveryCodes", rc
            ));
        } catch (Exception e) {
            logger.error("MFA setup failed for userId={}: {}", userId, e.getMessage(), e);
            // Return the exception message in the response for easier debugging in dev.
            // This is intentionally verbose for local debugging — remove or sanitize in production.
            String detail = e.getMessage() != null ? e.getMessage() : e.toString();
            return ResponseEntity.status(400).body(Map.of(
                    "error", "Failed to generate MFA setup data",
                    "detail", detail
            ));
        }
    }

    /** Step 2: user scans QR and submits a code to activate */
    @PostMapping("/verify-setup")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> verifySetup(@RequestBody Map<String, String> body,
                                         org.springframework.security.core.Authentication auth) {
        String code = body.get("code");
        Long userId = resolveUserId(auth);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","Invalid authentication"));
        User user = users.findById(userId).orElseThrow();

        String secret = user.getMfaSecret();
        if (secret == null || secret.isBlank()) {
            return ResponseEntity.badRequest().body("No secret generated");
        }

        if (mfa.verify(secret, code)) {
            user.setMfaEnabled(true);
            users.save(user);
            return ResponseEntity.ok(Map.of("ok", true));
        }
        return ResponseEntity.status(400).body(Map.of("ok", false, "error", "Invalid code"));
    }

    /** Second step of login: exchange mfaToken + 6-digit code for final tokens */
    @PostMapping("/verify-login")
    public ResponseEntity<?> verifyDuringLogin(@RequestBody Map<String, String> body) {
        String mfaToken = body.get("mfaToken");
        String code = body.get("code");

        Long userId = jwtService.parseMfaToken(mfaToken);       // ✅ use JwtService
        if (userId == null) return ResponseEntity.status(401).body("Invalid or expired mfaToken");

        User user = users.findById(userId).orElseThrow();
        if (!user.isMfaEnabled()) return ResponseEntity.badRequest().body("MFA not enabled");

        if (mfa.verify(user.getMfaSecret(), code)) {
            // ✅ issue real tokens
            Map<String,Object> tokens = new HashMap<>();
            tokens.put("accessToken", jwtService.generateAccessToken(user));
            tokens.put("refreshToken", jwtService.generateRefreshToken(user));
            return ResponseEntity.ok(tokens);
        }
        return ResponseEntity.status(400).body(Map.of("error","Invalid code"));
    }

    /** Disable MFA (require password + either valid OTP or a recovery code) */
    @PostMapping("/disable")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> disable(@RequestBody Map<String, String> body,
                                     org.springframework.security.core.Authentication auth) {
        Long userId = resolveUserId(auth);
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error","Invalid authentication"));
        String password = body.get("password");
        String otp = body.get("code");          // optional
        String recovery = body.get("recovery"); // optional

        User user = users.findById(userId).orElseThrow();
        if (user.getPasswordHash() == null || !bcrypt.matches(password, user.getPasswordHash())) {
            return ResponseEntity.status(401).body("Invalid password");
        }

        boolean ok = false;

        if (otp != null && !otp.isBlank()) {
            ok = mfa.verify(user.getMfaSecret(), otp);
        } else if (recovery != null && !recovery.isBlank()) {
            String updated = mfa.consumeRecoveryCode(user.getMfaRecoveryHashes(), recovery);
            if (updated != null) {
                ok = true;
                user.setMfaRecoveryHashes(updated); // consume the used code
            }
        }

        if (!ok) return ResponseEntity.status(400).body("Invalid OTP or recovery code");

        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        user.setMfaRecoveryHashes(null);
        users.save(user);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
