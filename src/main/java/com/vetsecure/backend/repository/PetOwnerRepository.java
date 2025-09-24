package com.vetsecure.backend.repository;

import com.vetsecure.backend.model.PetOwner;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetOwnerRepository extends JpaRepository<PetOwner, Long> {
    // Optionally add custom queries
}