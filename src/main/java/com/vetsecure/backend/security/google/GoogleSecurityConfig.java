package com.vetsecure.backend.security.google;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Configuration
@EnableWebSecurity
@Profile("google")
@EnableMethodSecurity // Enable @PreAuthorize annotations
public class GoogleSecurityConfig {

    @Value("${app.security.google.client-id}")
    private String googleClientId;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Bean
    SecurityFilterChain googleFilterChain(HttpSecurity http) throws Exception {
        http
                // Stateless API
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Enable CORS
                .cors(Customizer.withDefaults())
                // Authorize requests (you can open health if you want unauthenticated health checks)
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers(
                                "/api/auth/google/login",    // OAuth gateway
                                "/auth/mfa/verify-login",    // MFA verification (uses mfaToken)
                                "/auth/mfa/**",              // include MFA setup and verify endpoints
                                "/users/**",                 // allow user bootstrap and public reads during dev
                                "/roles",                    // allow roles lookup
                                "/actuator/health"           // Health check
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                // Enable JWT (resource server)
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(Customizer.withDefaults())
                )
                // Basic hardening
                .csrf(csrf -> csrf.disable())
                .headers(h -> h.frameOptions(frame -> frame.deny()));

        return http.build();
    }

    /**
     * Custom JWT decoder that handles both:
     * 1. Google ID tokens (for OAuth gateway validation)
     * 2. Backend access tokens (signed with HMAC secret)
     */
    @Bean
    JwtDecoder jwtDecoder() {
        // Create decoder for backend tokens (HMAC-signed)
        SecretKey key = new SecretKeySpec(
                jwtSecret.getBytes(StandardCharsets.UTF_8),
                "HmacSHA256"
        );
        NimbusJwtDecoder backendDecoder = NimbusJwtDecoder.withSecretKey(key).build();

        // Create decoder for Google tokens
        String googleIssuer = "https://accounts.google.com";
        JwtDecoder googleDecoder = JwtDecoders.fromIssuerLocation(googleIssuer);
        OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(googleIssuer);
        OAuth2TokenValidator<Jwt> withAudience = new GoogleAudienceValidator(googleClientId);
        if (googleDecoder instanceof NimbusJwtDecoder nimbusJwtDecoder) {
            nimbusJwtDecoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(withIssuer, withAudience));
        }

        // Return a composite decoder that tries backend first, then Google
        return token -> {
            try {
                // Try backend token first (most common case after login)
                return backendDecoder.decode(token);
            } catch (Exception e) {
                // If backend token fails, try Google token
                return googleDecoder.decode(token);
            }
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("http://localhost:3000", "http://127.0.0.1:3000"));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
        cfg.setAllowCredentials(true);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}