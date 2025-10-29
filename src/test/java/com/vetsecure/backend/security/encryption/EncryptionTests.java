package com.vetsecure.backend.security.encryption;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.encrypt.BytesEncryptor;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = {
    com.vetsecure.backend.BackendApplication.class,
    com.vetsecure.backend.testconfig.TestSecurityConfig.class,
    com.vetsecure.backend.config.TestJpaConfig.class
})
public class EncryptionTests {

    @Autowired
    private StringEncryptionConverter converter;

    @Test
    void testEncryptionConverter() {
        String sensitiveData = "This is sensitive information!";
        
        // Convert to database column
        String encrypted = converter.convertToDatabaseColumn(sensitiveData);
        assertNotNull(encrypted, "Encrypted value should not be null");
        assertNotEquals(sensitiveData, encrypted, "Encrypted value should be different from original");
        
        // Convert back from database column
        String decrypted = converter.convertToEntityAttribute(encrypted);
        assertEquals(sensitiveData, decrypted, "Decrypted value should match original");
    }

    @Test
    void testNullHandling() {
        assertNull(converter.convertToDatabaseColumn(null), "Should handle null input gracefully");
        assertNull(converter.convertToEntityAttribute(null), "Should handle null input gracefully");
    }

    @Test
    void testDifferentEncryptionsAreDifferent() {
        String sensitiveData = "Test data";
        String encrypted1 = converter.convertToDatabaseColumn(sensitiveData);
        String encrypted2 = converter.convertToDatabaseColumn(sensitiveData);
        
        assertNotEquals(encrypted1, encrypted2, "Each encryption should be unique");
        
        assertEquals(sensitiveData, converter.convertToEntityAttribute(encrypted1));
        assertEquals(sensitiveData, converter.convertToEntityAttribute(encrypted2));
    }
}