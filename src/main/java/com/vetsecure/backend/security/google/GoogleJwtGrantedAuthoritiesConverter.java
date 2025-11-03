package com.vetsecure.backend.security.google;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Converts a Google ID token into Spring Security authorities (roles)
 * based on whitelisted email lists from application-google.yml.
 * Any authenticated Google user gets ROLE_USER by default.
 */
@Component
@Profile("google")
public class GoogleJwtGrantedAuthoritiesConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Value("${app.security.google.super-admin-emails:}")
    private List<String> superAdmins;

    @Value("${app.security.google.clinic-admin-emails:}")
    private List<String> clinicAdmins;

    @Value("${app.security.google.vet-emails:}")
    private List<String> vets;

    @Value("${app.security.google.assistant-emails:}")
    private List<String> assistants;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String email = jwt.getClaimAsString("email");

        Set<SimpleGrantedAuthority> roles = new HashSet<>();
        roles.add(new SimpleGrantedAuthority("ROLE_USER"));

        if (email != null) {
            if (containsIgnoreCase(superAdmins, email))  roles.add(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
            if (containsIgnoreCase(clinicAdmins, email)) roles.add(new SimpleGrantedAuthority("ROLE_CLINIC_ADMIN"));
            if (containsIgnoreCase(vets, email))         roles.add(new SimpleGrantedAuthority("ROLE_VET"));
            if (containsIgnoreCase(assistants, email))   roles.add(new SimpleGrantedAuthority("ROLE_ASSISTANT"));
        }

        String principalName = (email != null && !email.isBlank()) ? email : jwt.getSubject();
        return new JwtAuthenticationToken(jwt, roles, principalName);
    }

    private boolean containsIgnoreCase(List<String> list, String value) {
        if (list == null) return false;
        for (String s : list) {
            if (s != null && s.equalsIgnoreCase(value)) return true;
        }
        return false;
    }
}