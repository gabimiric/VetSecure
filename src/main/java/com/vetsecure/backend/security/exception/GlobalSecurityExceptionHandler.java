package com.vetsecure.backend.security.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice
public class GlobalSecurityExceptionHandler {

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<SecurityErrorResponse> handleAuthenticationException(
            AuthenticationException ex, WebRequest request) {
        SecurityErrorResponse error = new SecurityErrorResponse(
            HttpStatus.UNAUTHORIZED.value(),
            "Authentication failed",
            request.getDescription(false)
        );
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<SecurityErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex, WebRequest request) {
        SecurityErrorResponse error = new SecurityErrorResponse(
            HttpStatus.FORBIDDEN.value(),
            "Access denied",
            request.getDescription(false)
        );
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<SecurityErrorResponse> handleAllExceptions(
            Exception ex, WebRequest request) {
        SecurityErrorResponse error = new SecurityErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "An internal error occurred",
            "Please contact support if the problem persists"
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

class SecurityErrorResponse {
    private final int status;
    private final String message;
    private final String details;

    public SecurityErrorResponse(int status, String message, String details) {
        this.status = status;
        this.message = message;
        this.details = details;
    }

    public int getStatus() { return status; }
    public String getMessage() { return message; }
    public String getDetails() { return details; }
}