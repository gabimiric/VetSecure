package com.vetsecure.backend.security.encryption;

import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "sensitive_data")
public class SensitiveData {
    
    @Id
    private Long id;
    
    @Convert(converter = AttributeEncryptor.class)
    private String sensitiveInfo;
    
    // getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getSensitiveInfo() { return sensitiveInfo; }
    public void setSensitiveInfo(String sensitiveInfo) { this.sensitiveInfo = sensitiveInfo; }
}