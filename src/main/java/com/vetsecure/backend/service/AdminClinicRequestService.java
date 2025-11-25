package com.vetsecure.backend.service;

import com.vetsecure.backend.model.Clinic;
import com.vetsecure.backend.model.ClinicRequest;
import com.vetsecure.backend.model.Role;
import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.ClinicRepository;
import com.vetsecure.backend.repository.ClinicRequestRepository;
import com.vetsecure.backend.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AdminClinicRequestService {

    private final ClinicRequestRepository repo;
    private final ClinicRepository clinics;
    private final UserRepository users;

    public AdminClinicRequestService(
            ClinicRequestRepository repo,
            ClinicRepository clinics,
            UserRepository users
    ) {
        this.repo = repo;
        this.clinics = clinics;
        this.users = users;
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

        User clinicAdmin = users.findByEmail(req.getAdminEmail())
                .orElseThrow(() -> new IllegalStateException(
                        "Clinic admin not found for email: " + req.getAdminEmail()));

        // Create or update the clinic row to mirror this approval
        Clinic clinic = clinics.findByClinicAdminEmailIgnoreCase(clinicAdmin.getEmail())
                .stream().findFirst().orElseGet(Clinic::new);

        clinic.setClinicAdmin(clinicAdmin);
        clinic.setName(req.getClinicName());
        clinic.setAddress(req.getAddress());
        clinic.setCity(req.getCity());
        clinic.setPhone(req.getPhone());
        clinic.setEmail(req.getAdminEmail());
        clinic.setStatus(Clinic.Status.APPROVED);
        clinics.save(clinic);

        // Promote the requester to CLINIC_ADMIN if they are not already elevated
        if (clinicAdmin.getRole() != null) {
            var current = clinicAdmin.getRole().getName();
            if (current != Role.RoleType.SUPER_ADMIN && current != Role.RoleType.CLINIC_ADMIN) {
                clinicAdmin.getRole().setName(Role.RoleType.CLINIC_ADMIN);
                users.save(clinicAdmin);
            }
        }

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

        // If a clinic already exists for this user, mark it rejected too
        clinics.findByClinicAdminEmailIgnoreCase(req.getAdminEmail())
                .forEach(c -> {
                    c.setStatus(Clinic.Status.REJECTED);
                    clinics.save(c);
                });

        return repo.save(req);
    }

    private void ensurePending(ClinicRequest req) {
        if (req.getStatus() != ClinicRequest.Status.PENDING) {
            throw new IllegalStateException("Only PENDING requests can be decided.");
        }
    }
}
