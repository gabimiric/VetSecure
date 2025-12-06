package com.vetsecure.backend.service;

import com.vetsecure.backend.model.Vet;
import com.vetsecure.backend.model.VetSchedule;
import com.vetsecure.backend.repository.VetRepository;
import com.vetsecure.backend.repository.VetScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
public class VetScheduleService {

    private final VetScheduleRepository vetScheduleRepository;
    private final VetRepository vetRepository;

    public VetScheduleService(
            VetScheduleRepository vetScheduleRepository,
            VetRepository vetRepository
    ) {
        this.vetScheduleRepository = vetScheduleRepository;
        this.vetRepository = vetRepository;
    }

    /**
     * Create a new vet schedule
     */
    @Transactional
    public VetSchedule createSchedule(Long vetId, Byte weekday, LocalTime startTime, LocalTime endTime) {
        // Validate vet exists
        Vet vet = vetRepository.findById(vetId)
                .orElseThrow(() -> new IllegalArgumentException("Vet not found with ID: " + vetId));

        // Validate weekday
        if (weekday < 0 || weekday > 6) {
            throw new IllegalArgumentException("Weekday must be between 0 (Sunday) and 6 (Saturday)");
        }

        // Validate times
        if (endTime.isBefore(startTime) || endTime.equals(startTime)) {
            throw new IllegalArgumentException("End time must be after start time");
        }

        // Create schedule
        VetSchedule schedule = new VetSchedule(vet, weekday, startTime, endTime);
        return vetScheduleRepository.save(schedule);
    }

    /**
     * Get schedule by ID
     */
    public VetSchedule getScheduleById(Long id) {
        return vetScheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found with ID: " + id));
    }

    /**
     * Get all schedules for a vet
     */
    public List<VetSchedule> getSchedulesByVetId(Long vetId) {
        return vetScheduleRepository.findByVetId(vetId);
    }

    /**
     * Get schedules for a vet by weekday
     */
    public List<VetSchedule> getSchedulesByVetIdAndWeekday(Long vetId, Byte weekday) {
        return vetScheduleRepository.findByVetIdAndWeekday(vetId, weekday);
    }

    /**
     * Get all schedules for vets in a specific clinic
     */
    public List<VetSchedule> getSchedulesByClinicId(Long clinicId) {
        return vetScheduleRepository.findByVetClinicId(clinicId);
    }

    /**
     * Update a vet schedule
     */
    @Transactional
    public VetSchedule updateSchedule(Long id, Byte weekday, LocalTime startTime, LocalTime endTime) {
        VetSchedule schedule = getScheduleById(id);

        // Validate weekday
        if (weekday < 0 || weekday > 6) {
            throw new IllegalArgumentException("Weekday must be between 0 (Sunday) and 6 (Saturday)");
        }

        // Validate times
        if (endTime.isBefore(startTime) || endTime.equals(startTime)) {
            throw new IllegalArgumentException("End time must be after start time");
        }

        schedule.setWeekday(weekday);
        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);

        return vetScheduleRepository.save(schedule);
    }

    /**
     * Delete a vet schedule
     */
    @Transactional
    public void deleteSchedule(Long id) {
        if (!vetScheduleRepository.existsById(id)) {
            throw new IllegalArgumentException("Schedule not found with ID: " + id);
        }
        vetScheduleRepository.deleteById(id);
    }

    /**
     * Delete all schedules for a vet
     */
    @Transactional
    public void deleteAllSchedulesByVetId(Long vetId) {
        List<VetSchedule> schedules = vetScheduleRepository.findByVetId(vetId);
        vetScheduleRepository.deleteAll(schedules);
    }
}

