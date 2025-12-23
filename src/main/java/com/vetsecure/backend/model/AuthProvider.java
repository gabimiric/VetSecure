package com.vetsecure.backend.model;

/**
 * Authentication provider for a user account.
 *
 * LOCAL  = classic username/email + password
 * GOOGLE = signed in via Google OAuth2 (Spring Security oauth2Login)
 */
public enum AuthProvider {
    LOCAL,
    GOOGLE
}


