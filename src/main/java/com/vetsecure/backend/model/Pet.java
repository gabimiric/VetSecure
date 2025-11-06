package com.vetsecure.backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "pet")
public class Pet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    @NotNull(message = "Owner is required")
    private PetOwner owner;

    @Column(nullable = false)
    @NotBlank(message = "Pet name is required")
    private String name;

    @NotBlank(message = "Pet species is required")
    private String species;

    @Size(max = 100, message = "Breed name too long")
    private String breed;

    @Pattern(regexp = "^(Male|Female|Unknown)$", message = "Invalid gender")
    private String gender;

    @DecimalMin(value = "0.1", message = "Weight must be positive")
    @DecimalMax(value = "500.0", message = "Weight seems unrealistic")
    private Double weight;

    @Column(name = "date_of_birth")
    @Past(message = "Birth date must be in the past")
    private LocalDate dateOfBirth;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public PetOwner getOwner() { return owner; }
    public void setOwner(PetOwner owner) { this.owner = owner; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecies() { return species; }
    public void setSpecies(String species) { this.species = species; }

    public String getBreed() { return breed; }
    public void setBreed(String breed) { this.breed = breed; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
}
