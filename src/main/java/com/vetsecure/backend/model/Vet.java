package com.vetsecure.backend.model;

import jakarta.persistence.*;
import com.vetsecure.backend.security.encryption.StringEncryptionConverter;

@Entity
@Table(name = "vets")
public class Vet {
    @Id
    private Long id; // same as user.id

    @OneToOne
    @MapsId
    @JoinColumn(name = "id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Convert(converter = StringEncryptionConverter.class)
    private String license;

    @Column(nullable = false)
    private String role; // assistant or doctor

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Clinic getClinic() { return clinic; }
    public void setClinic(Clinic clinic) { this.clinic = clinic; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getLicense() { return license; }
    public void setLicense(String license) { this.license = license; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
