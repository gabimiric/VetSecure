package com.vetsecure.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration; // <- keep
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.http.HttpMethod;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.context.annotation.Lazy;

import java.util.List;


@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsServiceImpl uds;
    private final SecurityHeadersFilter securityHeadersFilter;
    private final com.vetsecure.backend.security.oauth2.CustomOAuth2UserService oAuth2UserService;
    private final com.vetsecure.backend.security.oauth2.OAuth2LoginSuccessHandler oAuth2SuccessHandler;
    private final com.vetsecure.backend.security.oauth2.OAuth2LoginFailureHandler oAuth2FailureHandler;

    public SecurityConfig(
            JwtAuthFilter jwtAuthFilter,
            UserDetailsServiceImpl uds,
            SecurityHeadersFilter securityHeadersFilter,
            @Lazy com.vetsecure.backend.security.oauth2.CustomOAuth2UserService oAuth2UserService,
            @Lazy com.vetsecure.backend.security.oauth2.OAuth2LoginSuccessHandler oAuth2SuccessHandler,
            @Lazy com.vetsecure.backend.security.oauth2.OAuth2LoginFailureHandler oAuth2FailureHandler
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.uds = uds;
        this.securityHeadersFilter = securityHeadersFilter;
        this.oAuth2UserService = oAuth2UserService;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
        this.oAuth2FailureHandler = oAuth2FailureHandler;
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                // Security headers are handled by SecurityHeadersFilter to avoid duplicates
                .headers(headers -> headers.disable())
                // Keep JWT endpoints stateless in practice, but OAuth2 login needs an HttpSession for state.
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                // Enable Google OAuth2 login (additive; does not change existing /api/auth/login flow)
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.userService(oAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)
                )
                .authorizeHttpRequests(auth -> auth
                        // OAuth2 endpoints must be public so Spring Security can start/finish the redirect flow
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        // Root path - return 404 but with security headers
                        .requestMatchers("/").permitAll()
                        // —— Public endpoints (first step login, refresh, MFA second step, docs) ——
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/auth/mfa/verify-login",     // current MFA controller base
                                "/auth/mfa/**",               // allow MFA setup/verify during dev
                                "/api/auth/mfa/verify-login", // include if you later move under /api
                                "/roles", "/roles/**", "/api/roles", "/api/roles/**", // registration/public bootstrap endpoints
                                "/users", "/pet-owners", "/vets",         // registration/public bootstrap endpoints
                        "/v3/api-docs/**", "/swagger-ui/**",
                        "/public/**",
                        "/actuator/health", "/actuator/info"
                ).permitAll()
                // Allow unauthenticated clinic request submission
                .requestMatchers(HttpMethod.POST, "/api/clinic-requests").permitAll()
                        // Allow public read of clinics (only approved should be shown client-side)
                        .requestMatchers(HttpMethod.GET, "/clinics", "/clinics/**", "/api/clinics", "/api/clinics/**").permitAll()

                // —— Admin endpoints ——
                .requestMatchers("/api/admin/**").hasAnyRole("SUPER_ADMIN","CLINIC_ADMIN")
                        
                        // —— Authenticated endpoints (require valid JWT) ——
                        .requestMatchers(
                                "/api/clinic-requests/me",
                                "/pets/**",                     // PetController - Pet management
                                "/appointments/**",             // AppointmentController - Appointment booking/management
                                "/vet-schedules/**",            // VetScheduleController - Vet schedules
                                "/clinic-schedules/**",         // ClinicScheduleController - Clinic schedules
                                "/api/owners/**",               // OwnerController - Pet owner management
                                "/api/clinics/me/**",           // ClinicSelfController - Clinic self-management
                                "/users/me",                    // UserController - View own profile
                                "/users/**",                    // UserController - User management
                                "/pet-owners/me/**"             // PetOwnerController - Pet owner self-management
                        ).authenticated()

                        // —— Everything else requires auth ——
                        .anyRequest().authenticated()
                )
                .authenticationProvider(daoAuthProvider())
                .addFilterBefore(securityHeadersFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    AuthenticationProvider daoAuthProvider() {
        var dao = new DaoAuthenticationProvider();
        dao.setUserDetailsService(uds);
        dao.setPasswordEncoder(passwordEncoder());
        return dao;
    }

    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var cfg = new CorsConfiguration();
        // Allow common dev frontend origins (CRA uses localhost:3000 by default)
        cfg.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:8080"
        ));
        cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization","Content-Type","X-Requested-With"));
        cfg.setAllowCredentials(true);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
