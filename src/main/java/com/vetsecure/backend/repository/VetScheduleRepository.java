package com.vetsecure.backend.repository;

import com.vetsecure.backend.model.VetSchedule;
import com.vetsecure.backend.model.Vet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VetScheduleRepository extends JpaRepository<VetSchedule, Long> {

    // Find all schedules for a specific vet
    List<VetSchedule> findByVet(Vet vet);

    // Find all schedules for a specific vet by vet ID
    List<VetSchedule> findByVetId(Long vetId);

    // Find schedule for a specific vet and weekday
    List<VetSchedule> findByVetAndWeekday(Vet vet, Byte weekday);

    // Find schedule by vet ID and weekday
    List<VetSchedule> findByVetIdAndWeekday(Long vetId, Byte weekday);

    // Find all schedules for vets in a specific clinic
    List<VetSchedule> findByVetClinicId(Long clinicId);
}

