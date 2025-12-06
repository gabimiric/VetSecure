package com.vetsecure.backend.service;

import com.vetsecure.backend.model.Appointment;
import com.vetsecure.backend.model.Appointment.AppointmentStatus;
import com.vetsecure.backend.model.Pet;
import com.vetsecure.backend.model.Vet;
import com.vetsecure.backend.model.VetSchedule;
import com.vetsecure.backend.repository.AppointmentRepository;
import com.vetsecure.backend.repository.PetRepository;
import com.vetsecure.backend.repository.VetRepository;
import com.vetsecure.backend.repository.VetScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final VetRepository vetRepository;
    private final PetRepository petRepository;
    private final VetScheduleRepository vetScheduleRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            VetRepository vetRepository,
            PetRepository petRepository,
            VetScheduleRepository vetScheduleRepository
    ) {
        this.appointmentRepository = appointmentRepository;
        this.vetRepository = vetRepository;
        this.petRepository = petRepository;
        this.vetScheduleRepository = vetScheduleRepository;
    }

    /**
     * Create a new appointment
     */
    @Transactional
    public Appointment createAppointment(Long vetId, Long petId, LocalDate date, LocalTime time, String reason) {
        // Validate vet exists
        Vet vet = vetRepository.findById(vetId)
                .orElseThrow(() -> new IllegalArgumentException("Vet not found with ID: " + vetId));

        // Validate pet exists
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new IllegalArgumentException("Pet not found with ID: " + petId));

        // Validate date is in the future
        if (date.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Appointment date must be in the future");
        }

        // Check if vet is available at the requested time
        if (!isVetAvailable(vetId, date, time)) {
            throw new IllegalArgumentException("Vet is not available at the requested date and time");
        }

        // Check for conflicting appointments
        if (appointmentRepository.existsByVetIdAndDateAndTimeAndStatusNot(vetId, date, time)) {
            throw new IllegalArgumentException("Vet already has an appointment at this time");
        }

        // Create appointment
        Appointment appointment = new Appointment(vet, pet, date, time, reason);
        return appointmentRepository.save(appointment);
    }

    /**
     * Get appointment by ID
     */
    public Appointment getAppointmentById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found with ID: " + id));
    }

    /**
     * Get all appointments for a vet
     */
    public List<Appointment> getAppointmentsByVetId(Long vetId) {
        return appointmentRepository.findByVetId(vetId);
    }

    /**
     * Get all appointments for a pet
     */
    public List<Appointment> getAppointmentsByPetId(Long petId) {
        return appointmentRepository.findByPetId(petId);
    }

    /**
     * Get all appointments for a pet owner
     */
    public List<Appointment> getAppointmentsByPetOwnerId(Long ownerId) {
        return appointmentRepository.findByPetOwnerId(ownerId);
    }

    /**
     * Get all appointments for a clinic
     */
    public List<Appointment> getAppointmentsByClinicId(Long clinicId) {
        return appointmentRepository.findByClinicId(clinicId);
    }

    /**
     * Get appointments by vet and date
     */
    public List<Appointment> getAppointmentsByVetIdAndDate(Long vetId, LocalDate date) {
        return appointmentRepository.findByVetIdAndDate(vetId, date);
    }

    /**
     * Get appointments by date range
     */
    public List<Appointment> getAppointmentsByVetIdAndDateRange(Long vetId, LocalDate startDate, LocalDate endDate) {
        return appointmentRepository.findByVetIdAndDateBetween(vetId, startDate, endDate);
    }

    /**
     * Update appointment status
     */
    @Transactional
    public Appointment updateAppointmentStatus(Long id, AppointmentStatus status) {
        Appointment appointment = getAppointmentById(id);
        appointment.setStatus(status);
        return appointmentRepository.save(appointment);
    }

    /**
     * Complete appointment with diagnosis and prescription
     */
    @Transactional
    public Appointment completeAppointment(Long id, String diagnosis, String prescription) {
        Appointment appointment = getAppointmentById(id);

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot complete a cancelled appointment");
        }

        appointment.setDiagnosis(diagnosis);
        appointment.setPrescription(prescription);
        appointment.setStatus(AppointmentStatus.COMPLETED);
        return appointmentRepository.save(appointment);
    }

    /**
     * Cancel an appointment
     */
    @Transactional
    public Appointment cancelAppointment(Long id) {
        Appointment appointment = getAppointmentById(id);

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel a completed appointment");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        return appointmentRepository.save(appointment);
    }

    /**
     * Update appointment details
     */
    @Transactional
    public Appointment updateAppointment(Long id, LocalDate date, LocalTime time, String reason) {
        Appointment appointment = getAppointmentById(id);

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new IllegalStateException("Cannot modify a completed appointment");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot modify a cancelled appointment");
        }

        // Validate new time slot if changed
        if (!date.equals(appointment.getDate()) || !time.equals(appointment.getTime())) {
            if (!isVetAvailable(appointment.getVet().getId(), date, time)) {
                throw new IllegalArgumentException("Vet is not available at the requested date and time");
            }

            // Check for conflicts (excluding current appointment)
            if (appointmentRepository.existsByVetIdAndDateAndTimeAndStatusNot(
                    appointment.getVet().getId(), date, time)) {
                throw new IllegalArgumentException("Vet already has an appointment at this time");
            }
        }

        appointment.setDate(date);
        appointment.setTime(time);
        appointment.setReason(reason);
        return appointmentRepository.save(appointment);
    }

    /**
     * Check if vet is available at a specific date and time based on their schedule
     */
    private boolean isVetAvailable(Long vetId, LocalDate date, LocalTime time) {
        // Get day of week (Sunday = 0, Monday = 1, ..., Saturday = 6)
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        byte weekday = (byte) (dayOfWeek.getValue() % 7); // Convert to 0-6 range

        // Get vet schedules for this weekday
        List<VetSchedule> schedules = vetScheduleRepository.findByVetIdAndWeekday(vetId, weekday);

        if (schedules.isEmpty()) {
            return false; // Vet doesn't work on this day
        }

        // Check if time falls within any schedule
        for (VetSchedule schedule : schedules) {
            if (!time.isBefore(schedule.getStartTime()) && !time.isAfter(schedule.getEndTime())) {
                return true;
            }
        }

        return false;
    }

    /**
     * Delete an appointment (admin only)
     */
    @Transactional
    public void deleteAppointment(Long id) {
        if (!appointmentRepository.existsById(id)) {
            throw new IllegalArgumentException("Appointment not found with ID: " + id);
        }
        appointmentRepository.deleteById(id);
    }
}

