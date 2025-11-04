package com.vetsecure.backend.security.google;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@Profile("google")
public class GoogleSecurityConfig {

    @Value("${app.security.google.client-id}")
    private String googleClientId;

    @Bean
    SecurityFilterChain googleFilterChain(HttpSecurity http) throws Exception {
        http
            // Stateless API
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Authorize requests (you can open health if you want unauthenticated health checks)
            .authorizeHttpRequests(auth -> auth
                //.requestMatchers("/actuator/health").permitAll()
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
     * Use Google's issuer to create a NimbusJwtDecoder and add both issuer+audience validators.
     */
    @Bean
    JwtDecoder jwtDecoder() {
        // Build from issuer; Google publishes JWKS under this issuer
        String issuer = "https://accounts.google.com";
        NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation(issuer);

        OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(issuer);
        OAuth2TokenValidator<Jwt> withAudience = new GoogleAudienceValidator(googleClientId);

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(withIssuer, withAudience));
        return decoder;
    }
}