package com.vetsecure.backend.service;

import com.vetsecure.backend.model.Clinic;
import com.vetsecure.backend.model.ClinicSchedule;
import com.vetsecure.backend.repository.ClinicRepository;
import com.vetsecure.backend.repository.ClinicScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
public class ClinicScheduleService {

    private final ClinicScheduleRepository clinicScheduleRepository;
    private final ClinicRepository clinicRepository;

    public ClinicScheduleService(
            ClinicScheduleRepository clinicScheduleRepository,
            ClinicRepository clinicRepository
    ) {
        this.clinicScheduleRepository = clinicScheduleRepository;
        this.clinicRepository = clinicRepository;
    }

    /**
     * Create a new clinic schedule
     */
    @Transactional
    public ClinicSchedule createSchedule(Long clinicId, Byte weekday, LocalTime openTime, LocalTime closeTime) {
        // Validate clinic exists
        Clinic clinic = clinicRepository.findById(clinicId)
                .orElseThrow(() -> new IllegalArgumentException("Clinic not found with ID: " + clinicId));

        // Validate weekday
        if (weekday < 0 || weekday > 6) {
            throw new IllegalArgumentException("Weekday must be between 0 (Sunday) and 6 (Saturday)");
        }

        // Validate times
        if (closeTime.isBefore(openTime) || closeTime.equals(openTime)) {
            throw new IllegalArgumentException("Closing time must be after opening time");
        }

        // Create schedule
        ClinicSchedule schedule = new ClinicSchedule(clinic, weekday, openTime, closeTime);
        return clinicScheduleRepository.save(schedule);
    }

    /**
     * Get schedule by ID
     */
    public ClinicSchedule getScheduleById(Long id) {
        return clinicScheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found with ID: " + id));
    }

    /**
     * Get all schedules for a clinic
     */
    public List<ClinicSchedule> getSchedulesByClinicId(Long clinicId) {
        return clinicScheduleRepository.findByClinicId(clinicId);
    }

    /**
     * Get schedules for a clinic by weekday
     */
    public List<ClinicSchedule> getSchedulesByClinicIdAndWeekday(Long clinicId, Byte weekday) {
        return clinicScheduleRepository.findByClinicIdAndWeekday(clinicId, weekday);
    }

    /**
     * Update a clinic schedule
     */
    @Transactional
    public ClinicSchedule updateSchedule(Long id, Byte weekday, LocalTime openTime, LocalTime closeTime) {
        ClinicSchedule schedule = getScheduleById(id);

        // Validate weekday
        if (weekday < 0 || weekday > 6) {
            throw new IllegalArgumentException("Weekday must be between 0 (Sunday) and 6 (Saturday)");
        }

        // Validate times
        if (closeTime.isBefore(openTime) || closeTime.equals(openTime)) {
            throw new IllegalArgumentException("Closing time must be after opening time");
        }

        schedule.setWeekday(weekday);
        schedule.setOpenTime(openTime);
        schedule.setCloseTime(closeTime);

        return clinicScheduleRepository.save(schedule);
    }

    /**
     * Delete a clinic schedule
     */
    @Transactional
    public void deleteSchedule(Long id) {
        if (!clinicScheduleRepository.existsById(id)) {
            throw new IllegalArgumentException("Schedule not found with ID: " + id);
        }
        clinicScheduleRepository.deleteById(id);
    }

    /**
     * Delete all schedules for a clinic
     */
    @Transactional
    public void deleteAllSchedulesByClinicId(Long clinicId) {
        List<ClinicSchedule> schedules = clinicScheduleRepository.findByClinicId(clinicId);
        clinicScheduleRepository.deleteAll(schedules);
    }
}

