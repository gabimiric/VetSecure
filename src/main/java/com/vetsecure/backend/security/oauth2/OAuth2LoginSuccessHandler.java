package com.vetsecure.backend.security.oauth2;

import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.UserRepository;
import com.vetsecure.backend.security.JwtService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Locale;

/**
 * After successful Google OAuth2 login, mint the existing backend JWT (and optional MFA token)
 * and redirect the browser back to the React login page.
 *
 * This keeps Google OAuth additive and avoids any frontend token exchange hacks.
 */
@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository users;

    /**
     * Where to send the browser after OAuth2 completes.
     * Example (dev): http://localhost:8080/login
     */
    @Value("${app.oauth2.redirect-uri}")
    private String frontendRedirectUri;

    public OAuth2LoginSuccessHandler(JwtService jwtService, UserRepository users) {
        this.jwtService = jwtService;
        this.users = users;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof OAuth2User oauth2User)) {
            response.sendRedirect(frontendRedirectUri);
            return;
        }

        String email = oauth2User.getAttribute("email");
        if (email == null) {
            response.sendRedirect(UriComponentsBuilder.fromUriString(frontendRedirectUri)
                    .queryParam("error", "oauth2_missing_email")
                    .build()
                    .toUriString());
            return;
        }

        User user = users.findByEmail(email.trim().toLowerCase(Locale.ROOT))
                .orElse(null);
        if (user == null) {
            // CustomOAuth2UserService should have created/linked the user already.
            response.sendRedirect(UriComponentsBuilder.fromUriString(frontendRedirectUri)
                    .queryParam("error", "oauth2_user_not_linked")
                    .build()
                    .toUriString());
            return;
        }

        // If MFA enabled, require the same second step as classic login
        if (user.isMfaEnabled()) {
            String mfaToken = jwtService.generateMfaToken(user.getId());
            String target = UriComponentsBuilder.fromUriString(frontendRedirectUri)
                    .queryParam("mfaRequired", "true")
                    .queryParam("mfaToken", mfaToken)
                    .build()
                    .toUriString();
            response.sendRedirect(target);
            return;
        }

        String accessToken = jwtService.generateAccessToken(user);
        String target = UriComponentsBuilder.fromUriString(frontendRedirectUri)
                .queryParam("token", accessToken)
                .build()
                .toUriString();
        response.sendRedirect(target);
    }
}


