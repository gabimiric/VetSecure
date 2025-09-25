//package com.vetsecure.backend.controller;
//
//import com.vetsecure.backend.model.Clinic;
//import com.vetsecure.backend.model.ClinicRequest;
//import com.vetsecure.backend.repository.ClinicRepository;
//import com.vetsecure.backend.repository.ClinicRequestRepository;
//import jakarta.transaction.Transactional;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.time.Instant;
//import java.util.List;
//
//@RestController
//@RequestMapping("/api/admin-legacy")  // <-- moved off /api/admin to avoid conflicts
//@CrossOrigin // dev convenience; later tighten with proper auth/CORS
//public class AdminController {
//
//    private final ClinicRequestRepository requestRepo;
//    private final ClinicRepository clinicRepo;
//
//    public AdminController(ClinicRequestRepository requestRepo, ClinicRepository clinicRepo) {
//        this.requestRepo = requestRepo;
//        this.clinicRepo = clinicRepo;
//    }
//
//    // List requests by status (defaults to PENDING)
//    @GetMapping("/clinic-requests")
//    public List<ClinicRequest> list(@RequestParam(defaultValue = "PENDING") ClinicRequest.Status status) {
//        return requestRepo.findByStatusOrderByIdDesc(status);
//    }
//
//    // Approve: mark request + create a clinic row
//    @PostMapping("/clinic-requests/{id}/approve")
//    @Transactional
//    public ResponseEntity<?> approve(@PathVariable Long id, @RequestParam(required = false) String decidedBy) {
//        ClinicRequest req = requestRepo.findById(id).orElse(null);
//        if (req == null) return ResponseEntity.notFound().build();
//        if (req.getStatus() == ClinicRequest.Status.APPROVED)
//            return ResponseEntity.ok().body("Already approved");
//
//        req.setStatus(ClinicRequest.Status.APPROVED);
//        req.setDecidedAt(Instant.now());
//        if (decidedBy != null && !decidedBy.isBlank()) req.setDecidedBy(decidedBy);
//        requestRepo.save(req);
//
//        Clinic clinic = new Clinic()
//                .setName(req.getClinicName())
//                .setAddress(req.getAddress())
//                .setCity(req.getCity())
//                .setPhone(req.getPhone())
//                .setStatus(Clinic.Status.ACTIVE);
//        clinicRepo.save(clinic);
//
//        return ResponseEntity.ok(clinic);
//    }
//
//    // Reject
//    @PostMapping("/clinic-requests/{id}/reject")
//    public ResponseEntity<?> reject(@PathVariable Long id, @RequestParam(required = false) String decidedBy) {
//        ClinicRequest req = requestRepo.findById(id).orElse(null);
//        if (req == null) return ResponseEntity.notFound().build();
//        req.setStatus(ClinicRequest.Status.REJECTED);
//        req.setDecidedAt(Instant.now());
//        if (decidedBy != null && !decidedBy.isBlank()) req.setDecidedBy(decidedBy);
//        requestRepo.save(req);
//        return ResponseEntity.ok().build();
//    }
//}