package com.vetsecure.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtService {

    private final SecretKey key;
    private final long ttlMillis;
    private static final String ISS = "vetsecure";
    private static final String AUD = "vetsecure-api";
    private static final long SKEW_MS = 30_000;

    public JwtService(
            @Value("${jwt.secret:CHANGE_ME_32CHARS_MINIMUM}") String secret,
            @Value("${jwt.ttlMillis:86400000}") long ttlMillis) {
        if (secret.length() < 32) throw new IllegalStateException("JWT secret must be ≥ 32 chars");
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.ttlMillis = ttlMillis;
    }

    public String generate(String subjectEmail) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setIssuer(ISS).setAudience(AUD)
                .setSubject(subjectEmail)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + ttlMillis))
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

}
