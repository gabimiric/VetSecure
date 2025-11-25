package com.vetsecure.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8080")
                        .allowedMethods("GET","POST","PUT","DELETE","OPTIONS")
                        .allowedHeaders("Authorization","Content-Type","X-Requested-With")
                        .allowCredentials(true);
                registry.addMapping("/users/**")
                        .allowedOrigins("http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8080")
                        .allowedMethods("GET","POST","PUT","DELETE","OPTIONS")
                        .allowedHeaders("Authorization","Content-Type","X-Requested-With")
                        .allowCredentials(true);
            }
        };
    }
}