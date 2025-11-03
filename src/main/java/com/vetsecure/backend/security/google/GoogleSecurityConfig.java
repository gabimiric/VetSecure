package com.vetsecure.backend.security.google;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@Profile("google")
public class GoogleSecurityConfig {

    @Value("${google.oauth.client-id}")
    private String googleClientId;

    private static final String ISSUER = "https://accounts.google.com";

    @Bean
    SecurityFilterChain api(HttpSecurity http,
                            GoogleJwtGrantedAuthoritiesConverter authoritiesConverter) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth -> oauth
                .jwt(jwt -> {
                    jwt.decoder(jwtDecoder());
                    jwt.jwtAuthenticationConverter(authoritiesConverter);
                })
            );

        return http.build();
    }

    @Bean
    NimbusJwtDecoder jwtDecoder() {
        // Build from Google’s OIDC issuer (includes signature keys)
        NimbusJwtDecoder decoder = (NimbusJwtDecoder) JwtDecoders.fromIssuerLocation(ISSUER);

        // 1) Validate issuer
        var withIssuer = JwtValidators.createDefaultWithIssuer(ISSUER);

        // 2) Validate audience = your Google Client ID
        OAuth2TokenValidator<Jwt> audienceValidator = jwt -> {
            var aud = jwt.getAudience();
            if (aud != null && aud.contains(googleClientId)) {
                return OAuth2TokenValidatorResult.success();
            }
            return OAuth2TokenValidatorResult.failure(
                new OAuth2Error("invalid_token", "Invalid audience (aud) for this API", null)
            );
        };

        // Chain validators (issuer first, then audience)
        decoder.setJwtValidator(jwt -> {
            var r1 = withIssuer.validate(jwt);
            if (r1.hasErrors()) return r1;
            return audienceValidator.validate(jwt);
        });

        return decoder;
    }
}