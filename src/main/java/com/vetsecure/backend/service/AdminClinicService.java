package com.vetsecure.backend.service;

import com.vetsecure.backend.model.Clinic;
import com.vetsecure.backend.model.Role;
import com.vetsecure.backend.repository.ClinicRepository;
import com.vetsecure.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AdminClinicService {

    private final ClinicRepository clinics;
    private final UserRepository users;

    public AdminClinicService(ClinicRepository clinics, UserRepository users) {
        this.clinics = clinics; this.users = users;
    }

    /** Optional time filter; if 'after' is null, just filter by status. */
    public List<Clinic> list(Clinic.Status status, Instant after) {
        if (status == null) return clinics.findAll(); // or add a sorted method if you prefer
        if (after != null) return clinics.findByStatusAndCreatedAtAfterOrderByCreatedAtDesc(status, after);
        return clinics.findByStatus(status);
    }

    public Clinic get(Long id) {
        return clinics.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Clinic not found: " + id));
    }

    @Transactional
    public Clinic approve(Long id) {
        var c = get(id);
        ensurePending(c);
        c.setStatus(Clinic.Status.APPROVED);

        // OPTIONAL: promote the clinic admin to CLINIC_ADMIN (skip if already SUPER_ADMIN/CLINIC_ADMIN)
        var admin = c.getClinicAdmin();
        if (admin != null && admin.getRole() != null) {
            var current = admin.getRole().getName();
            if (current != Role.RoleType.SUPER_ADMIN && current != Role.RoleType.CLINIC_ADMIN) {
                admin.getRole().setName(Role.RoleType.CLINIC_ADMIN); // flip enum on existing role row
                users.save(admin);
            }
        }

        return clinics.save(c);
    }

    @Transactional
    public Clinic reject(Long id) {
        var c = get(id);
        ensurePending(c);
        c.setStatus(Clinic.Status.REJECTED);
        return clinics.save(c);
    }

    private void ensurePending(Clinic c) {
        if (c.getStatus() != Clinic.Status.PENDING) {
            throw new IllegalStateException("Only PENDING clinics can be decided.");
        }
    }
}
