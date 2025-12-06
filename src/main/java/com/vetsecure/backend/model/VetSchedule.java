package com.vetsecure.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalTime;

@Entity
@Table(name = "vet_schedules")
public class VetSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vet_id", nullable = false)
    @NotNull(message = "Vet is required")
    @JsonIgnoreProperties({"clinic", "user", "schedules"})
    private Vet vet;

    @Column(nullable = false)
    @NotNull(message = "Weekday is required")
    @Min(value = 0, message = "Weekday must be between 0 (Sunday) and 6 (Saturday)")
    @Max(value = 6, message = "Weekday must be between 0 (Sunday) and 6 (Saturday)")
    private Byte weekday; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    @Column(name = "start_time", nullable = false)
    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    @NotNull(message = "End time is required")
    private LocalTime endTime;

    // Constructors
    public VetSchedule() {}

    public VetSchedule(Vet vet, Byte weekday, LocalTime startTime, LocalTime endTime) {
        this.vet = vet;
        this.weekday = weekday;
        this.startTime = startTime;
        this.endTime = endTime;
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

    public Byte getWeekday() {
        return weekday;
    }

    public void setWeekday(Byte weekday) {
        this.weekday = weekday;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }
}

