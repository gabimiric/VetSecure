# VetSecure Security Documentation

## Security Features

### 1. Authentication & Authorization
- Multi-Factor Authentication (MFA)
  - Time-based One-Time Password (TOTP)
  - Compatible with Google Authenticator/Authy
  - Recovery codes for backup access
- Role-Based Access Control (RBAC)
- JWT-based authentication
- Secure password storage using BCrypt

### 2. API Security
- Rate limiting (100 requests per minute per IP)
- Input validation using Jakarta Bean Validation
- CSRF protection
- Secure error handling

### 3. Data Security
- Database encryption for sensitive data
- SSL/TLS encryption for data in transit
- Secure session management
- Audit logging for security events

### 4. Frontend Security
- Content Security Policy (CSP)
- XSS protection headers
- CSRF tokens
- Secure cookie attributes

## Configuration Guide

### Environment Variables
Required environment variables:
```bash
# Database
export DB_USERNAME=your_db_username
export DB_PASSWORD=your_db_password

# SSL
export SSL_KEY_STORE_PASSWORD=your_keystore_password

# Encryption
export ENCRYPTION_SECRET=your_encryption_key
```

### SSL Certificate Setup
1. Generate a keystore:
```bash
keytool -genkeypair -alias vetsecure -keyalg RSA -keysize 2048 \
        -storetype PKCS12 -keystore keystore.p12 -validity 365
```
2. Place the keystore.p12 file in src/main/resources/

### Security Headers
The application automatically configures:
- X-XSS-Protection
- X-Content-Type-Options
- X-Frame-Options
- Content-Security-Policy
- Strict-Transport-Security

### Rate Limiting Configuration
Configure in application.properties:
```properties
rate.limit.enabled=true
rate.limit.requests-per-second=100
```

### Audit Logging
Security events are logged to:
- Database (security_audit_logs table)
- Retention period: 90 days

## Security Testing
Run security tests:
```bash
./mvnw test -Dtest=SecurityConfigurationTest
```

## Best Practices
1. Regularly rotate encryption keys and passwords
2. Monitor audit logs for suspicious activity
3. Keep dependencies updated
4. Regular security testing and vulnerability scanning
5. Follow the principle of least privilege for user roles