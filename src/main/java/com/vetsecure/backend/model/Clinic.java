package com.vetsecure.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

@Entity
@Table(name = "clinics")
public class Clinic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(max = 160)
    private String name;

    @NotBlank @Size(max = 255)
    private String address;

    @Size(max = 120)
    private String city;

    @Size(max = 40)
    private String phone;

    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;

    @Column(name = "created_at", updatable = false, insertable = false)
    private Instant createdAt; // managed by DB default

    public enum Status { ACTIVE, INACTIVE }

    public Long getId() { return id; }
    public String getName() { return name; }
    public Clinic setName(String name) { this.name = name; return this; }
    public String getAddress() { return address; }
    public Clinic setAddress(String address) { this.address = address; return this; }
    public String getCity() { return city; }
    public Clinic setCity(String city) { this.city = city; return this; }
    public String getPhone() { return phone; }
    public Clinic setPhone(String phone) { this.phone = phone; return this; }
    public Status getStatus() { return status; }
    public Clinic setStatus(Status status) { this.status = status; return this; }
    public Instant getCreatedAt() { return createdAt; }
}