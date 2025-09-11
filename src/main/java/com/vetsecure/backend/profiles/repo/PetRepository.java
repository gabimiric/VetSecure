package com.vetsecure.backend.profiles.repo;

import com.vetsecure.backend.profiles.domain.Pet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PetRepository extends JpaRepository<Pet,Long> {
}
