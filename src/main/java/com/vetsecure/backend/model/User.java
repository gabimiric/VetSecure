package com.vetsecure.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_username", columnNames = "username"),
                @UniqueConstraint(name = "uk_user_email", columnNames = "email")
        })
public class User {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(max = 60)
    private String username;

    @NotBlank @Email @Size(max = 180)
    private String email;

    @NotBlank @Size(max = 120)
    private String name;

    @Size(max = 40)
    private String phone;

    /** Store hash, not plain password */
    @JsonIgnore
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    /** Optional 1:1 link to Owner profile (create Owner first, then attach here) */
    @OneToOne
    @JoinColumn(name = "owner_id", foreignKey = @ForeignKey(name = "fk_user_owner"))
    private Owner owner;

    // getters/setters (NO getPassword() !!)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public Owner getOwner() { return owner; }
    public void setOwner(Owner owner) { this.owner = owner; }
}