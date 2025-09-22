package com.vetsecure.backend.repository;

import com.vetsecure.backend.model.Vet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VetRepository extends JpaRepository<Vet, Long> {
    List<Vet> findByClinicId(Long clinicId);
}
