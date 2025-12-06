package com.vetsecure.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vet_id", nullable = false)
    @NotNull(message = "Vet is required")
    @JsonIgnoreProperties({"clinic", "user", "schedules"})
    private Vet vet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false)
    @NotNull(message = "Pet is required")
    @JsonIgnoreProperties({"owner"})
    private Pet pet;

    @Column(nullable = false)
    @NotNull(message = "Appointment date is required")
    @Future(message = "Appointment date must be in the future")
    private LocalDate date;

    @Column(nullable = false)
    @NotNull(message = "Appointment time is required")
    private LocalTime time;

    @Column(length = 500)
    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason;

    @Column(length = 1000)
    @Size(max = 1000, message = "Diagnosis cannot exceed 1000 characters")
    private String diagnosis;

    @Column(length = 1000)
    @Size(max = 1000, message = "Prescription cannot exceed 1000 characters")
    private String prescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status = AppointmentStatus.PENDING;

    public enum AppointmentStatus {
        PENDING,
        COMPLETED,
        CANCELLED
    }

    // Constructors
    public Appointment() {}

    public Appointment(Vet vet, Pet pet, LocalDate date, LocalTime time, String reason) {
        this.vet = vet;
        this.pet = pet;
        this.date = date;
        this.time = time;
        this.reason = reason;
        this.status = AppointmentStatus.PENDING;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Vet getVet() {
        return vet;
    }

    public void setVet(Vet vet) {
        this.vet = vet;
    }

    public Pet getPet() {
        return pet;
    }

    public void setPet(Pet pet) {
        this.pet = pet;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getPrescription() {
        return prescription;
    }

    public void setPrescription(String prescription) {
        this.prescription = prescription;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }
}

