package com.vetsecure.backend.repository;

import com.vetsecure.backend.model.PetOwner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OwnerRepository extends JpaRepository<PetOwner, Long> {
    boolean existsByUser_EmailIgnoreCase(String email);
    Optional<PetOwner> findByUser_EmailIgnoreCase(String email);
}
