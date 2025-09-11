package com.vetsecure.backend.profiles.repo;

import com.vetsecure.backend.profiles.domain.PetOwner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PetOwnerRepository extends JpaRepository<PetOwner, UUID> {
}
