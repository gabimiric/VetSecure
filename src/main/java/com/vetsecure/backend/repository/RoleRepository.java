package com.vetsecure.backend.repository;

import com.vetsecure.backend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> {
    // Optionally add custom queries if needed
}
