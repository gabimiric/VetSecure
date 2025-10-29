package com.vetsecure.backend.security.audit;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;

@Aspect
@Component
public class SensitiveDataAccessAudit {

    private final SecurityAuditLogRepository auditLogRepository;

    public SensitiveDataAccessAudit(SecurityAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Before("@annotation(com.vetsecure.backend.security.audit.AuditSensitiveData)")
    public void logSensitiveDataAccess(JoinPoint joinPoint) {
        String username = SecurityContextHolder.getContext().getAuthentication() != null ?
                SecurityContextHolder.getContext().getAuthentication().getName() : "anonymous";

        SecurityAuditLog log = new SecurityAuditLog();
        log.setTimestamp(LocalDateTime.now());
        log.setUsername(username);
        log.setEvent("ACCESS_SENSITIVE_DATA");
        log.setStatus(SecurityAuditLog.EventStatus.SUCCESS);
        log.setDetails(String.format("Method: %s, Class: %s, Parameters: %s",
            joinPoint.getSignature().getName(),
            joinPoint.getTarget().getClass().getSimpleName(),
            Arrays.toString(joinPoint.getArgs())));

        auditLogRepository.save(log);
    }

    @AfterReturning(pointcut = "execution(* com.vetsecure.backend.security.encryption.StringEncryptionConverter.*(..))", 
                    returning = "result")
    public void logEncryptionOperation(JoinPoint joinPoint, Object result) {
        String username = SecurityContextHolder.getContext().getAuthentication() != null ?
                SecurityContextHolder.getContext().getAuthentication().getName() : "system";

        SecurityAuditLog log = new SecurityAuditLog();
        log.setTimestamp(LocalDateTime.now());
        log.setUsername(username);
        log.setEvent("ENCRYPTION_OPERATION");
        log.setStatus(SecurityAuditLog.EventStatus.SUCCESS);
        log.setDetails(String.format("Method: %s, Class: StringEncryptionConverter, Operation completed successfully",
            joinPoint.getSignature().getName()));

        auditLogRepository.save(log);
    }
}