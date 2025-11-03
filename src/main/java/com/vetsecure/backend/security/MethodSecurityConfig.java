package com.vetsecure.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
@Profile("!google")
@Configuration
@EnableMethodSecurity // enables @PreAuthorize / @PostAuthorize
public class MethodSecurityConfig {

    @Bean
    RoleHierarchyImpl roleHierarchy() {
        var rh = new RoleHierarchyImpl();
        // Adjust order to your needs. I removed PET as a “role” (keep PET as domain entity).
        rh.setHierarchy("""
        ROLE_SUPER_ADMIN > ROLE_CLINIC_ADMIN
        ROLE_CLINIC_ADMIN > ROLE_VET
        ROLE_VET > ROLE_ASSISTANT
        ROLE_ASSISTANT > ROLE_PET_OWNER
    """);
        return rh;
    }

    @Bean
    DefaultMethodSecurityExpressionHandler methodSecurityExpressionHandler(RoleHierarchyImpl rh) {
        var h = new DefaultMethodSecurityExpressionHandler();
        h.setRoleHierarchy(rh);
        return h;
    }
}
