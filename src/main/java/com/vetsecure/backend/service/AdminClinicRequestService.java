package com.vetsecure.backend.service;

import com.vetsecure.backend.model.ClinicRequest;
import com.vetsecure.backend.repository.ClinicRequestRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AdminClinicRequestService {

    private final ClinicRequestRepository repo;

    public AdminClinicRequestService(ClinicRequestRepository repo) {
        this.repo = repo;
    }

    /** List, optionally filtered by status. Always sorted by id DESC. */
    public List<ClinicRequest> list(ClinicRequest.Status status) {
        if (status != null) {
            return repo.findByStatusOrderByIdDesc(status);
        }
        // No status filter → get all sorted DESC by id
        return repo.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    public ClinicRequest get(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ClinicRequest not found: " + id));
    }

    @Transactional
    public ClinicRequest approve(Long id, String adminEmail) {
        var req = get(id);
        ensurePending(req);
        req.setStatus(ClinicRequest.Status.APPROVED);
        req.setDecidedAt(Instant.now());
        req.setDecidedBy(adminEmail);
        return repo.save(req);
    }

    @Transactional
    public ClinicRequest reject(Long id, String adminEmail) {
        var req = get(id);
        ensurePending(req);
        req.setStatus(ClinicRequest.Status.REJECTED);
        req.setDecidedAt(Instant.now());
        req.setDecidedBy(adminEmail);
        return repo.save(req);
    }

    private void ensurePending(ClinicRequest req) {
        if (req.getStatus() != ClinicRequest.Status.PENDING) {
            throw new IllegalStateException("Only PENDING requests can be decided.");
        }
    }
}
