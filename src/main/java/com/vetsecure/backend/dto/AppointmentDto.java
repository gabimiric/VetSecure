package com.vetsecure.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class AppointmentDto {
    public Long id;
    public LocalDate date;
    public LocalTime time;
    public String startsAt;
    public String status;
    public String reason;
    public String diagnosis;
    public String prescription;
    public PetDto pet;
}