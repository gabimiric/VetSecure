package com.vetsecure.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalTime;

@Entity
@Table(name = "clinic_schedules")
public class ClinicSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinic_id", nullable = false)
    @NotNull(message = "Clinic is required")
    @JsonIgnoreProperties({"vets", "schedules"})
    private Clinic clinic;

    @Column(nullable = false)
    @NotNull(message = "Weekday is required")
    @Min(value = 0, message = "Weekday must be between 0 (Sunday) and 6 (Saturday)")
    @Max(value = 6, message = "Weekday must be between 0 (Sunday) and 6 (Saturday)")
    private Byte weekday; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    @Column(name = "open_time", nullable = false)
    @NotNull(message = "Opening time is required")
    private LocalTime openTime;

    @Column(name = "close_time", nullable = false)
    @NotNull(message = "Closing time is required")
    private LocalTime closeTime;

    // Constructors
    public ClinicSchedule() {}

    public ClinicSchedule(Clinic clinic, Byte weekday, LocalTime openTime, LocalTime closeTime) {
        this.clinic = clinic;
        this.weekday = weekday;
        this.openTime = openTime;
        this.closeTime = closeTime;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Clinic getClinic() {
        return clinic;
    }

    public void setClinic(Clinic clinic) {
        this.clinic = clinic;
    }

    public Byte getWeekday() {
        return weekday;
    }

    public void setWeekday(Byte weekday) {
        this.weekday = weekday;
    }

    public LocalTime getOpenTime() {
        return openTime;
    }

    public void setOpenTime(LocalTime openTime) {
        this.openTime = openTime;
    }

    public LocalTime getCloseTime() {
        return closeTime;
    }

    public void setCloseTime(LocalTime closeTime) {
        this.closeTime = closeTime;
    }
}

