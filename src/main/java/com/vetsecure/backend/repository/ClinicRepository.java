package com.vetsecure.backend.repository;

import com.vetsecure.backend.model.Clinic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface ClinicRepository extends JpaRepository<Clinic, Long> {
    List<Clinic> findByStatus(Clinic.Status status);

    List<Clinic> findByStatusAndCreatedAtAfterOrderByCreatedAtDesc(
            Clinic.Status status, Instant after
    );

    List<Clinic> findByClinicAdminEmailIgnoreCase(String email);

    List<Clinic> findByClinicAdminId(Long clinicAdminId);
}
