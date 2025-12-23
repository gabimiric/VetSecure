package com.vetsecure.backend.security.oauth2;

import com.vetsecure.backend.model.AuthProvider;
import com.vetsecure.backend.model.Role;
import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.RoleRepository;
import com.vetsecure.backend.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Loads Google userinfo via Spring Security's DefaultOAuth2UserService and then:
 * - finds existing user by email and links Google identity, OR
 * - auto-creates a new user with a generated passwordHash (so classic auth remains valid for all existing users)
 *
 * Critical note: we do NOT accept any Google tokens from the frontend.
 * Spring Security performs the OAuth2 flow and calls this service server-side.
 */
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder passwordEncoder;

    public CustomOAuth2UserService(UserRepository users, RoleRepository roles, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.roles = roles;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        if (!"google".equalsIgnoreCase(registrationId)) {
            // Only Google is supported in this project right now
            return oauth2User;
        }

        Map<String, Object> attrs = oauth2User.getAttributes();
        String email = stringAttr(attrs, "email");
        String name = stringAttr(attrs, "name");
        String picture = stringAttr(attrs, "picture");
        String sub = stringAttr(attrs, "sub");

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Google OAuth2 response did not contain an email");
        }

        // Normalize email lookup
        String emailNorm = email.trim().toLowerCase(Locale.ROOT);

        User user = users.findByEmail(emailNorm).orElseGet(() -> createUserFromGoogle(emailNorm, name, picture, sub));

        // Link/update Google fields on existing users
        boolean changed = false;
        if (user.getGoogleSub() == null && sub != null && !sub.isBlank()) {
            user.setGoogleSub(sub);
            changed = true;
        }
        if (picture != null && !picture.isBlank() && !Objects.equals(user.getProfilePictureUrl(), picture)) {
            user.setProfilePictureUrl(picture);
            changed = true;
        }
        if (user.getAuthProvider() != AuthProvider.GOOGLE) {
            user.setAuthProvider(AuthProvider.GOOGLE);
            changed = true;
        }
        if (changed) {
            users.save(user);
        }

        // Use the DB role for authorities
        Set<SimpleGrantedAuthority> authorities = new HashSet<>();
        if (user.getRole() != null && user.getRole().getName() != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName().name()));
        }

        // Spring Security will use "email" as the principal name key
        return new DefaultOAuth2User(authorities, attrs, "email");
    }

    private User createUserFromGoogle(String email, String name, String picture, String sub) {
        User u = new User();
        u.setEmail(email);

        // Username must be unique. Use email prefix and fall back with a suffix if needed.
        u.setUsername(generateUniqueUsername(email));

        // User.passwordHash is mandatory in this codebase. Generate a random password hash so classic auth stays intact.
        String randomPassword = UUID.randomUUID() + "-" + UUID.randomUUID();
        u.setPasswordHash(passwordEncoder.encode(randomPassword));

        // Default role = PET_OWNER (existing behavior stays unchanged for classic auth users)
        Role role = roles.findByName(Role.RoleType.PET_OWNER)
                .orElseThrow(() -> new IllegalStateException("Default role PET_OWNER missing. Ensure roles are seeded."));
        u.setRole(role);

        u.setAuthProvider(AuthProvider.GOOGLE);
        u.setGoogleSub(sub);
        u.setProfilePictureUrl(picture);

        // MFA defaults remain unchanged (disabled by default)
        return users.save(u);
    }

    private String generateUniqueUsername(String email) {
        String base = email.split("@")[0]
                .replaceAll("[^a-zA-Z0-9._-]", "")
                .trim();
        if (base.isBlank()) base = "user";

        String candidate = base;
        int i = 0;
        while (users.findByUsername(candidate).isPresent()) {
            i++;
            candidate = base + i;
        }
        return candidate;
    }

    private static String stringAttr(Map<String, Object> attrs, String key) {
        Object v = attrs.get(key);
        return v == null ? null : String.valueOf(v);
    }
}


