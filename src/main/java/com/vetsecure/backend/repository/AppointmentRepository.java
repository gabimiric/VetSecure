package com.vetsecure.backend.repository;

import com.vetsecure.backend.model.Appointment;
import com.vetsecure.backend.model.Appointment.AppointmentStatus;
import com.vetsecure.backend.model.Vet;
import com.vetsecure.backend.model.Pet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // Find all appointments for a specific vet
    List<Appointment> findByVet(Vet vet);

    // Find all appointments for a specific vet by vet ID
    List<Appointment> findByVetId(Long vetId);

    // Find all appointments for a specific pet
    List<Appointment> findByPet(Pet pet);

    // Find all appointments for a specific pet by pet ID
    List<Appointment> findByPetId(Long petId);

    // Find appointments by status
    List<Appointment> findByStatus(AppointmentStatus status);

    // Find appointments by vet and date
    List<Appointment> findByVetIdAndDate(Long vetId, LocalDate date);

    // Find appointments by pet and date
    List<Appointment> findByPetIdAndDate(Long petId, LocalDate date);

    // Find appointments by vet, date, and status
    List<Appointment> findByVetIdAndDateAndStatus(Long vetId, LocalDate date, AppointmentStatus status);

    // Find appointments by pet owner
    @Query("SELECT a FROM Appointment a WHERE a.pet.owner.id = :ownerId")
    List<Appointment> findByPetOwnerId(@Param("ownerId") Long ownerId);

    // Find appointments by clinic (through vet)
    @Query("SELECT a FROM Appointment a WHERE a.vet.clinic.id = :clinicId")
    List<Appointment> findByClinicId(@Param("clinicId") Long clinicId);

    // Find appointments by vet and date range
    @Query("SELECT a FROM Appointment a WHERE a.vet.id = :vetId AND a.date BETWEEN :startDate AND :endDate")
    List<Appointment> findByVetIdAndDateBetween(
        @Param("vetId") Long vetId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    // Check if a vet has a conflicting appointment at a specific date and time
    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.vet.id = :vetId AND a.date = :date AND a.time = :time AND a.status != 'CANCELLED'")
    boolean existsByVetIdAndDateAndTimeAndStatusNot(
        @Param("vetId") Long vetId,
        @Param("date") LocalDate date,
        @Param("time") LocalTime time
    );
}

