//package com.vetsecure.backend.controller;
//
//import com.vetsecure.backend.model.ClinicRequest;
//import com.vetsecure.backend.repository.ClinicRequestRepository;
//import jakarta.validation.Valid;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("/api/clinic-requests")
//@CrossOrigin // optional if you already use CRA proxy
//public class ClinicPublicController {
//
//    private final ClinicRequestRepository repo;
//
//    public ClinicPublicController(ClinicRequestRepository repo) {
//        this.repo = repo;
//    }
//
//    @PostMapping
//    public ResponseEntity<ClinicRequest> submit(@Valid @RequestBody ClinicRequest body) {
//        // Ensure requests always start as PENDING (even if client sends another value)
//        body.setStatus(ClinicRequest.Status.PENDING);
//        ClinicRequest saved = repo.save(body);
//        return ResponseEntity.ok(saved);
//    }
//}