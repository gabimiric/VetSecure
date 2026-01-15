package com.vetsecure.backend.repository;

import com.vetsecure.backend.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalTime;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // fetch joins to load pet + owner + vet (+ vet.clinic) to avoid LazyInitialization / Jackson issues
    @Query("select a from Appointment a " +
           "join fetch a.pet p " +
           "join fetch p.owner o " +
           "left join fetch a.vet v " +
           "left join fetch v.clinic c " +
           "where o.id = :ownerId")
    List<Appointment> findByPetOwnerId(@Param("ownerId") Long ownerId);

    // fallback: fetch all appointments with related pet/owner/vet info for safe serialization
    @Query("select a from Appointment a " +
           "left join fetch a.pet p " +
           "left join fetch p.owner o " +
           "left join fetch a.vet v " +
           "left join fetch v.clinic c")
    List<Appointment> findAllWithFetch();

    // --- Added methods expected by AppointmentService ---

    @Query("select a from Appointment a " +
           "left join fetch a.pet p " +
           "left join fetch p.owner o " +
           "left join fetch a.vet v " +
           "left join fetch v.clinic c " +
           "where v.id = :vetId")
    List<Appointment> findByVetId(@Param("vetId") Long vetId);

    @Query("select a from Appointment a " +
           "left join fetch a.pet p " +
           "left join fetch p.owner o " +
           "left join fetch a.vet v " +
           "left join fetch v.clinic c " +
           "where p.id = :petId")
    List<Appointment> findByPetId(@Param("petId") Long petId);

    @Query("select a from Appointment a " +
           "left join fetch a.pet p " +
           "left join fetch p.owner o " +
           "left join fetch a.vet v " +
           "left join fetch v.clinic c " +
           "where v.clinic.id = :clinicId")
    List<Appointment> findByClinicId(@Param("clinicId") Long clinicId);

    @Query("select a from Appointment a " +
           "left join fetch a.pet p " +
           "left join fetch p.owner o " +
           "left join fetch a.vet v " +
           "left join fetch v.clinic c " +
           "where v.id = :vetId and a.date = :date")
    List<Appointment> findByVetIdAndDate(@Param("vetId") Long vetId, @Param("date") LocalDate date);

    @Query("select a from Appointment a " +
           "left join fetch a.pet p " +
           "left join fetch p.owner o " +
           "left join fetch a.vet v " +
           "left join fetch v.clinic c " +
           "where v.id = :vetId and a.date between :from and :to")
    List<Appointment> findByVetIdAndDateBetween(@Param("vetId") Long vetId,
                                                @Param("from") LocalDate from,
                                                @Param("to") LocalDate to);

    /**
     * Check if there exists a non-cancelled appointment for the vet at the same date/time.
     * The service called expects a method named like this; implement with a JPQL query that
     * treats "CANCELLED" as the excluded status (status stored as STRING in DB).
     */
    @Query("select case when count(a) > 0 then true else false end from Appointment a " +
           "where a.vet.id = :vetId and a.date = :date and a.time = :time and a.status <> 'CANCELLED'")
    boolean existsByVetIdAndDateAndTimeAndStatusNot(@Param("vetId") Long vetId,
                                                    @Param("date") LocalDate date,
                                                    @Param("time") LocalTime time);
}

