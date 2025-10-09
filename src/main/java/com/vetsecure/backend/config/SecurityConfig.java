//package com.vetsecure.backend.config;

//           ------------------------------  NAHUI S PLIAJA ------------------------------
//
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.security.config.Customizer;
//import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
//import org.springframework.security.config.http.SessionCreationPolicy;
//import org.springframework.security.web.SecurityFilterChain;
//import org.springframework.web.cors.CorsConfiguration;
//import org.springframework.web.cors.CorsConfigurationSource;
//import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
//import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
//import org.springframework.security.crypto.password.PasswordEncoder;
//
//import java.util.List;
//
//@Configuration
//@EnableWebSecurity
//public class SecurityConfig {
//
//    @Bean
//    public SecurityFilterChain api(HttpSecurity http) throws Exception {
//        http
//                .cors(Customizer.withDefaults())
//                .csrf(csrf -> csrf.disable())
//                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
//                .httpBasic(b -> b.disable())
//                .authorizeHttpRequests(auth -> auth
//                         Public endpoints ONLY here:
//                        .requestMatchers("/auth/**", "/public/**").permitAll()
//                         (optional) actuator health/info if you expose them:
//                         .requestMatchers("/actuator/health", "/actuator/info").permitAll()
//                         Everything else requires authentication:
//                        .anyRequest().authenticated()
//                );
//
//         If you have a JwtAuthFilter, register it before UsernamePasswordAuthenticationFilter:
//         http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
//
//        return http.build();
//    }
//
//    @Bean
//    public CorsConfigurationSource corsConfigurationSource() {
//        var cfg = new CorsConfiguration();
//        cfg.setAllowedOrigins(List.of("http://localhost:3000"));
//        cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
//        cfg.setAllowedHeaders(List.of("Authorization","Content-Type","X-Requested-With"));
//        cfg.setAllowCredentials(true);
//
//        var source = new UrlBasedCorsConfigurationSource();
//        source.registerCorsConfiguration("/**", cfg);
//        return source;
//    }
//
//    @Bean
//    public PasswordEncoder passwordEncoder() {
//         increase strength if you want (e.g., 12)
//        return new BCryptPasswordEncoder();
//    }
//}
//