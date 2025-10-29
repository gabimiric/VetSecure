package com.vetsecure.backend.security.audit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDateTime;

@Service
public class SecurityAuditService {
    
    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public void logSecurityEvent(String event, String username, String ipAddress, 
                               String details, SecurityAuditLog.EventStatus status) {
        SecurityAuditLog log = new SecurityAuditLog();
        log.setEvent(event);
        log.setUsername(username);
        log.setIpAddress(ipAddress);
        log.setTimestamp(LocalDateTime.now());
        log.setDetails(details);
        log.setStatus(status);
        
        entityManager.persist(log);
    }

    @Transactional(readOnly = true)
    public void detectSuspiciousActivity(String username, String ipAddress) {
        String jpql = """
            SELECT COUNT(l) FROM SecurityAuditLog l 
            WHERE l.username = :username 
            AND l.ipAddress = :ipAddress 
            AND l.status = :status 
            AND l.timestamp > :timeAgo
            """;
            
        long failedAttempts = entityManager.createQuery(jpql, Long.class)
            .setParameter("username", username)
            .setParameter("ipAddress", ipAddress)
            .setParameter("status", SecurityAuditLog.EventStatus.FAILURE)
            .setParameter("timeAgo", LocalDateTime.now().minusMinutes(15))
            .getSingleResult();
            
        if (failedAttempts > 5) {
            logSecurityEvent(
                "SUSPICIOUS_ACTIVITY_DETECTED",
                username,
                ipAddress,
                "Multiple failed attempts detected",
                SecurityAuditLog.EventStatus.FAILURE
            );
        }
    }
}