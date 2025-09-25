//package com.vetsecure.backend.controller;
//
//import com.vetsecure.backend.model.ClinicRequest;
//import com.vetsecure.backend.repository.ClinicRequestRepository;
//import org.springframework.data.domain.Sort;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.time.Instant;
//import java.util.List;
//import java.util.Map;
//import java.util.Optional;
//
//@RestController
//@RequestMapping("/api/admin/clinic-requests")
//@CrossOrigin
//public class AdminClinicRequestController {
//
//    private final ClinicRequestRepository repo;
//
//    public AdminClinicRequestController(ClinicRequestRepository repo) {
//        this.repo = repo;
//    }
//
//    @GetMapping
//    public List<ClinicRequest> list(
//            @RequestParam(name = "status", required = false) ClinicRequest.Status status) {
//
//        if (status != null) {
//            return repo.findByStatusOrderByIdDesc(status);
//        }
//        // Option A: use built-in sorting instead of a custom repo method
//        return repo.findAll(Sort.by(Sort.Direction.DESC, "id"));
//    }
//
//    @GetMapping("/{id}")
//    public ResponseEntity<ClinicRequest> one(@PathVariable Long id) {
//        return repo.findById(id)
//                .map(ResponseEntity::ok)
//                .orElse(ResponseEntity.notFound().build());
//    }
//
//    @PostMapping("/{id}/approve")
//    public ResponseEntity<ClinicRequest> approve(
//            @PathVariable Long id,
//            @RequestBody(required = false) Map<String, String> body) {
//
//        Optional<ClinicRequest> opt = repo.findById(id);
//        if (opt.isEmpty()) return ResponseEntity.notFound().build();
//
//        ClinicRequest cr = opt.get();
//        cr.setStatus(ClinicRequest.Status.APPROVED);
//        cr.setDecidedAt(Instant.now());
//        cr.setDecidedBy(body != null && body.get("decidedBy") != null ? body.get("decidedBy") : "admin");
//
//        return ResponseEntity.ok(repo.save(cr));
//    }
//
//    @PostMapping("/{id}/reject")
//    public ResponseEntity<ClinicRequest> reject(
//            @PathVariable Long id,
//            @RequestBody(required = false) Map<String, String> body) {
//
//        Optional<ClinicRequest> opt = repo.findById(id);
//        if (opt.isEmpty()) return ResponseEntity.notFound().build();
//
//        ClinicRequest cr = opt.get();
//        cr.setStatus(ClinicRequest.Status.REJECTED);
//        cr.setDecidedAt(Instant.now());
//        cr.setDecidedBy(body != null && body.get("decidedBy") != null ? body.get("decidedBy") : "admin");
//
//        return ResponseEntity.ok(repo.save(cr));
//    }
//}