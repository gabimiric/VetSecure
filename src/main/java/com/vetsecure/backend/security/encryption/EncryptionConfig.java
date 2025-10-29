package com.vetsecure.backend.security.encryption;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.encrypt.AesBytesEncryptor;
import org.springframework.security.crypto.encrypt.BytesEncryptor;

@Configuration
@ConfigurationProperties(prefix = "vetsecure.encryption")
public class EncryptionConfig {
    
    private String secret;
    private String salt;

    @Bean
    public BytesEncryptor bytesEncryptor() {
        if (secret == null || salt == null) {
            throw new IllegalStateException("Encryption secret and salt must be configured");
        }

        // Trim whitespace
        secret = secret.trim();
        salt = salt.trim();

        // Validate hex format (must be exactly 32 hex characters for 16 bytes)
        if (!secret.matches("[0-9a-fA-F]{32}")) {
            throw new IllegalArgumentException(String.format(
                "Encryption secret must be 32-character hex string. Length: %d, Value (first 20): '%s', Valid: %s",
                secret.length(), secret.substring(0, Math.min(secret.length(), 20)), secret.matches("[0-9a-fA-F]+")
            ));
        }
        if (!salt.matches("[0-9a-fA-F]{32}")) {
            throw new IllegalArgumentException(String.format(
                "Encryption salt must be 32-character hex string. Length: %d, Value (first 20): '%s', Valid: %s",
                salt.length(), salt.substring(0, Math.min(salt.length(), 20)), salt.matches("[0-9a-fA-F]+")
            ));
        }

        return new AesBytesEncryptor(secret, salt);
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public void setSalt(String salt) {
        this.salt = salt;
    }
}