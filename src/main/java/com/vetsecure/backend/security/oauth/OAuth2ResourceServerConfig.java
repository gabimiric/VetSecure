// package com.vetsecure.backend.security.oauth;

// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.boot.actuate.autoconfigure.security.servlet.EndpointRequest;
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.context.annotation.Profile;
// import org.springframework.core.annotation.Order;
// import org.springframework.security.config.Customizer;
// import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
// import org.springframework.security.config.annotation.web.builders.HttpSecurity;
// import org.springframework.security.oauth2.jwt.JwtDecoder;
// import org.springframework.security.oauth2.jwt.JwtDecoders;
// import org.springframework.security.web.SecurityFilterChain;

// @Configuration
// @Profile("!google")
// @EnableMethodSecurity(prePostEnabled = true)
// public class OAuth2ResourceServerConfig {

//     /**
//      * Chain #1: Permit all ACTUATOR endpoints (health, info, etc.).
//      * Must be evaluated BEFORE the main OAuth chain.
//      */
//     @Bean
//     @Order(0)
//     SecurityFilterChain actuator(HttpSecurity http) throws Exception {
//         http
//             .securityMatcher(EndpointRequest.toAnyEndpoint())
//             .csrf(csrf -> csrf.disable())
//             .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
//         return http.build();
//     }

//     /**
//      * Chain #2: Main API — OAuth2 Resource Server (Bearer tokens required).
//      */
//     @Bean
//     @Order(1)
//     SecurityFilterChain api(HttpSecurity http,
//                             JwtAuthenticationConverterWithScope converter) throws Exception {
//         http
//             .csrf(csrf -> csrf.disable())
//             .cors(Customizer.withDefaults())
//             .authorizeHttpRequests(auth -> auth
//                 // Swagger/openapi if you want public docs; keep or remove as you like:
//                 .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
//                 .anyRequest().authenticated()
//             )
//             .oauth2ResourceServer(oauth2 -> oauth2
//                 .jwt(jwt -> jwt.jwtAuthenticationConverter(converter))
//             );
//         return http.build();
//     }

//     @Bean
//     JwtDecoder jwtDecoder(@Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuer) {
//         return JwtDecoders.fromIssuerLocation(issuer);
//     }
// }