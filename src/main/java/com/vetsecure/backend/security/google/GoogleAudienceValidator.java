package com.vetsecure.backend.security.google;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.CollectionUtils;

import java.util.List;

final class GoogleAudienceValidator implements OAuth2TokenValidator<Jwt> {

    private static final OAuth2Error AUDIENCE_ERROR =
            new OAuth2Error("invalid_token", "Invalid audience (aud) for this API", null);

    private final String expectedAudience;

    GoogleAudienceValidator(String expectedAudience) {
        this.expectedAudience = expectedAudience;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt token) {
        List<String> aud = token.getAudience();
        if (CollectionUtils.isEmpty(aud)) {
            return OAuth2TokenValidatorResult.failure(AUDIENCE_ERROR);
        }
        // Google ID tokens may include multiple audiences; accept if ours is present
        return aud.contains(expectedAudience)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(AUDIENCE_ERROR);
    }
}