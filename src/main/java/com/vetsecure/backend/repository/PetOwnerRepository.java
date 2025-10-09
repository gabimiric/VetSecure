// com.vetsecure.backend.repository.PetOwnerRepository
package com.vetsecure.backend.repository;

import com.vetsecure.backend.model.PetOwner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PetOwnerRepository extends JpaRepository<PetOwner, Long> {
    Optional<PetOwner> findByUser_EmailIgnoreCase(String email);
    boolean existsByUser_EmailIgnoreCase(String email);
    boolean existsByPhone(String phone);
}
