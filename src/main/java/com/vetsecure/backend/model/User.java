package com.vetsecure.backend.model;

import jakarta.persistence.*;



@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "mfa_enabled", nullable = false)
    private boolean mfaEnabled = false;

    @Column(name = "mfa_secret")
    private String mfaSecret; // e.g., "JBSWY3DPEHPK3PXP"

    @Lob
    @Column(name = "mfa_recovery_hashes")
    private String mfaRecoveryHashes; // each line/CSV = BCrypt hash of a code

    @ManyToOne
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public boolean isMfaEnabled() { return mfaEnabled; }
    public void setMfaEnabled(boolean mfaEnabled) { this.mfaEnabled = mfaEnabled; }

    public String getMfaSecret() { return mfaSecret; }
    public void setMfaSecret(String mfaSecret) { this.mfaSecret = mfaSecret; }

    public String getMfaRecoveryHashes() { return mfaRecoveryHashes; }
    public void setMfaRecoveryHashes(String mfaRecoveryHashes) { this.mfaRecoveryHashes = mfaRecoveryHashes; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
