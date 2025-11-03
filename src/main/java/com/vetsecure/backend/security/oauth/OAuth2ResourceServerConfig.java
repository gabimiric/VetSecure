package com.vetsecure.backend.security.oauth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@Profile("oauth")
@EnableMethodSecurity(prePostEnabled = true)
public class OAuth2ResourceServerConfig {

    @Value("${cors.allowed-origins:*}")
    private String allowedOrigins;

    @Bean
    SecurityFilterChain api(HttpSecurity http, JwtAuthenticationConverterWithScope converter) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                // Open endpoints (adjust if you expose health/docs)
                .requestMatchers(
                    "/actuator/health",
                    "/openapi.yaml",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()

                // Example: read-only pets can be public if needed; otherwise secure:
                // .requestMatchers(HttpMethod.GET, "/api/pets/**").hasAuthority("SCOPE_pets:read")
                // .requestMatchers(HttpMethod.POST, "/api/pets/**").hasAuthority("SCOPE_pets:write")

                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(converter))
            );

        return http.build();
    }

    @Bean
    JwtDecoder jwtDecoder(@Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuer) {
        return JwtDecoders.fromIssuerLocation(issuer);
    }
}