package com.vetsecure.backend.security.encryption;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.security.crypto.encrypt.BytesEncryptor;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Converter
@Component
public class StringEncryptionConverter implements AttributeConverter<String, String> {

    private final BytesEncryptor encryptor;

    public StringEncryptionConverter(BytesEncryptor encryptor) {
        this.encryptor = encryptor;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        byte[] encrypted = encryptor.encrypt(attribute.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(encrypted);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        byte[] decrypted = encryptor.decrypt(Base64.getDecoder().decode(dbData));
        return new String(decrypted, StandardCharsets.UTF_8);
    }
}