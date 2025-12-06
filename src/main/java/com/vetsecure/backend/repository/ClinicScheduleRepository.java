package com.vetsecure.backend.repository;

import com.vetsecure.backend.model.ClinicSchedule;
import com.vetsecure.backend.model.Clinic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClinicScheduleRepository extends JpaRepository<ClinicSchedule, Long> {

    // Find all schedules for a specific clinic
    List<ClinicSchedule> findByClinic(Clinic clinic);

    // Find all schedules for a specific clinic by clinic ID
    List<ClinicSchedule> findByClinicId(Long clinicId);

    // Find schedule for a specific clinic and weekday
    List<ClinicSchedule> findByClinicAndWeekday(Clinic clinic, Byte weekday);

    // Find schedule by clinic ID and weekday
    List<ClinicSchedule> findByClinicIdAndWeekday(Long clinicId, Byte weekday);
}

