package com.vetsecure.backend.security.oauth;

import org.springframework.context.annotation.Profile;
import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;
@Profile("oauth")
@Component
public class JwtAuthenticationConverterWithScope implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(@NonNull Jwt jwt) {
        Collection<String> scopes = extractScopes(jwt);
        var authorities = scopes.stream()
                .map(s -> s.startsWith("SCOPE_") ? s : "SCOPE_" + s)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());

        return new org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken(jwt, authorities);
    }

    private Collection<String> extractScopes(Jwt jwt) {
        // Common places: "scope" (space-delimited), "scp" (array), or custom "authorities"
        Object scope = jwt.getClaims().get("scope");
        Object scp = jwt.getClaims().get("scp");
        Object auth = jwt.getClaims().get("authorities");

        Set<String> out = new HashSet<>();

        if (scope instanceof String s) {
            out.addAll(Arrays.asList(s.split(" ")));
        }
        if (scp instanceof Collection<?> c) {
            c.forEach(v -> { if (v != null) out.add(v.toString()); });
        }
        if (auth instanceof Collection<?> c) {
            c.forEach(v -> { if (v != null) out.add(v.toString()); });
        }

        return out;
    }
}