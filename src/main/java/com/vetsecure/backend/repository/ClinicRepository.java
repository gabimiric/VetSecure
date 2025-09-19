package com.vetsecure.backend.repository;

import com.vetsecure.backend.model.Clinic;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClinicRepository extends JpaRepository<Clinic, Long> { }