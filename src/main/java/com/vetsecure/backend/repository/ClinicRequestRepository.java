package com.vetsecure.backend.repository;

import com.vetsecure.backend.model.ClinicRequest;
import com.vetsecure.backend.model.ClinicRequest.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClinicRequestRepository extends JpaRepository<ClinicRequest, Long> {
    List<ClinicRequest> findByStatusOrderByIdDesc(Status status);
}