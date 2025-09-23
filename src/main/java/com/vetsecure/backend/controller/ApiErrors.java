package com.vetsecure.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
class ApiErrors {
    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<?> notFound(IllegalArgumentException e) { return ResponseEntity.notFound().build(); }

    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<?> badState(IllegalStateException e) { return ResponseEntity.badRequest().body(e.getMessage()); }
}
