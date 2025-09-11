package com.vetsecure.backend.identity.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity @Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private boolean emailVerified;
    private boolean mfaEnabled;

    // getters/setters
    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String ph) { this.passwordHash = ph; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean v) { this.emailVerified = v; }
    public boolean isMfaEnabled() { return mfaEnabled; }
    public void setMfaEnabled(boolean m) { this.mfaEnabled = m; }
}