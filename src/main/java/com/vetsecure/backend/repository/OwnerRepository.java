package com.vetsecure.backend.repository;

import com.vetsecure.backend.model.Owner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OwnerRepository extends JpaRepository<Owner, Long> {
    boolean existsByEmail(String email);
    Optional<Owner> findByEmail(String email);
}