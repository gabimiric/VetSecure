package com.vetsecure.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "clinics")
public class Clinic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "clinic_admin_id", nullable = false)
    private User clinicAdmin; // The user who requested / manages the clinic

    @NotBlank
    @Size(max = 160)
    private String name;

    @NotBlank
    @Size(max = 255)
    private String address;

    @Size(max = 120)
    private String city;

    @Size(max = 40)
    private String phone;

    @Size(max = 120)
    private String email;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING; // default for new requests

    @Column(name = "created_at", updatable = false, insertable = false)
    private Instant createdAt; // DB-managed timestamp

    @OneToMany(mappedBy = "clinic", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vet> vets; // Vets working in the clinic

    public enum Status {
        PENDING,    // requested, not yet approved
        APPROVED,   // approved clinic
        REJECTED,   // request rejected
        INACTIVE    // deactivated later
    }

    // --- Getters and Setters ---
    public Long getId() { return id; }

    public User getClinicAdmin() { return clinicAdmin; }
    public void setClinicAdmin(User clinicAdmin) { this.clinicAdmin = clinicAdmin; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }

    public List<Vet> getVets() { return vets; }
    public void setVets(List<Vet> vets) { this.vets = vets; }
}
