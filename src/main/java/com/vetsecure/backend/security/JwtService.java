package com.vetsecure.backend.security;

import com.vetsecure.backend.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Component
public class JwtService {

    private final SecretKey key;
    private final long accessTtlMillis;
    private final long refreshTtlMillis;
    private final long mfaTtlMillis;

    private static final String ISS = "vetsecure";
    private static final String AUD = "vetsecure-api";
    private static final long SKEW_MS = 30_000;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.accessTtlMillis:900000}") long accessTtlMillis,
            @Value("${jwt.refreshTtlMillis:1209600000}") long refreshTtlMillis,
            @Value("${jwt.mfaTtlMillis:120000}") long mfaTtlMillis
    ) {
        if (secret.length() < 32) throw new IllegalStateException("JWT secret must be ≥ 32 chars");
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTtlMillis = accessTtlMillis;
        this.refreshTtlMillis = refreshTtlMillis;
        this.mfaTtlMillis = mfaTtlMillis;
    }

    // ===== Legacy (kept for backward compatibility) =====
    public String generate(String subjectEmail) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setIssuer(ISS).setAudience(AUD)
                .setSubject(subjectEmail)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + accessTtlMillis))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .requireIssuer(ISS).requireAudience(AUD)
                .setAllowedClockSkewSeconds(SKEW_MS / 1000)
                .build()
                .parseClaimsJws(token);
    }

    // ===== New: Access / Refresh =====
    public String generateAccessToken(User u) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setIssuer(ISS).setAudience(AUD)
                .setSubject(String.valueOf(u.getId()))              // subject = userId
                .addClaims(Map.of(
                        "type", "ACCESS",
                        "email", u.getEmail(),
                        "username", u.getUsername(),
                        "role",  u.getRole().getName().name()
                ))
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + accessTtlMillis))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(User u) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setIssuer(ISS).setAudience(AUD)
                .setSubject(String.valueOf(u.getId()))
                .addClaims(Map.of("type", "REFRESH"))
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + refreshTtlMillis))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // ===== New: Short-lived MFA token =====
    public String generateMfaToken(Long userId) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setIssuer(ISS).setAudience(AUD)
                .setSubject(String.valueOf(userId))
                .addClaims(Map.of(
                        "type", "MFA",
                        "scope", "MFA"
                ))
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + mfaTtlMillis))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** @return userId if token is valid and scope==MFA; otherwise null */
    public Long parseMfaToken(String token) {
        try {
            var claims = parse(token).getBody();
            Object scope = claims.get("scope");
            if (!"MFA".equals(scope)) return null;
            return Long.valueOf(claims.getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }
}
