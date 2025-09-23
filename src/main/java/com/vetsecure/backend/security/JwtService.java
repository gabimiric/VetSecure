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
                .setSubject(subjectEmail)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + ttlMillis))
                .signWith(key, SignatureAlgorithm.HS256) // 0.11.5 style
                .compact();
    }

    /** Parse and return the full JWS; use getBody() to read Claims. */
    public Jws<Claims> parse(String token) {
        return Jwts.parserBuilder()            // 0.11.5 style
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
    }
}
