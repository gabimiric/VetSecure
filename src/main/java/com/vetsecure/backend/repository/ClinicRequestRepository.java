package com.vetsecure.backend.repository;

import com.vetsecure.backend.model.ClinicRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicRequestRepository extends JpaRepository<ClinicRequest, Long> { }