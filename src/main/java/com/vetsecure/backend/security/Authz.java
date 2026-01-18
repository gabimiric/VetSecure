package com.vetsecure.backend.security;

import com.vetsecure.backend.repository.PetOwnerRepository;
import com.vetsecure.backend.repository.PetRepository;
import com.vetsecure.backend.repository.AppointmentRepository;
import com.vetsecure.backend.repository.UserRepository;
import com.vetsecure.backend.repository.VetRepository;
import com.vetsecure.backend.model.Pet;
import com.vetsecure.backend.model.Appointment;
import com.vetsecure.backend.model.Vet;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

@Component("authz") // used in @PreAuthorize as @authz
public class Authz {

    private final PetOwnerRepository owners;
    private final PetRepository petRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final VetRepository vetRepository;

    public Authz(PetOwnerRepository owners, PetRepository petRepository,
                 AppointmentRepository appointmentRepository, UserRepository userRepository,
                 VetRepository vetRepository) {
        this.owners = owners;
        this.petRepository = petRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
        this.vetRepository = vetRepository;
    }

    /** true if the authenticated user owns PetOwner with id = ownerId */
    public boolean isSelfOwner(Authentication auth, Long ownerId) {
        if (auth == null || !auth.isAuthenticated()) return false;
        String email = auth.getName(); // JWT sub should be email
        return owners.findById(ownerId)
                .map(po -> po.getUser() != null && email.equalsIgnoreCase(po.getUser().getEmail()))
                .orElse(false);
    }

    /** allow creating Owner profile only if user is logged in and doesn't have one yet */
    public boolean canCreateOwnerForSelf(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        String email = auth.getName();
        return !owners.existsByUser_EmailIgnoreCase(email);
    }

    /** true if the authenticated user is the same as the user with userId */
    public boolean isSelf(Authentication auth, Long userId) {
        if (auth == null || !auth.isAuthenticated()) return false;
        String email = auth.getName();
        return userRepository.findById(userId)
                .map(user -> email.equalsIgnoreCase(user.getEmail()))
                .orElse(false);
    }

    /** true if the authenticated user can access the pet (owner or vet/admin) */
    public boolean canAccessPet(Authentication auth, Long petId) {
        if (auth == null || !auth.isAuthenticated()) return false;

        // Admins and vets can access any pet
        if (hasAnyRole(auth, "SUPER_ADMIN", "CLINIC_ADMIN", "VET", "ASSISTANT")) {
            return true;
        }

        // Check if user is the pet owner
        String email = auth.getName();
        return petRepository.findById(petId)
                .map(pet -> pet.getOwner() != null &&
                           pet.getOwner().getUser() != null &&
                           email.equalsIgnoreCase(pet.getOwner().getUser().getEmail()))
                .orElse(false);
    }

    /** true if the authenticated user can access the appointment */
    public boolean canAccessAppointment(Authentication auth, Long appointmentId) {
        if (auth == null || !auth.isAuthenticated()) return false;

        // Admins can access any appointment
        if (hasAnyRole(auth, "SUPER_ADMIN", "CLINIC_ADMIN")) {
            return true;
        }

        String email = auth.getName();
        return appointmentRepository.findById(appointmentId)
                .map(apt -> {
                    // Check if user is the pet owner
                    if (apt.getPet() != null && apt.getPet().getOwner() != null &&
                        apt.getPet().getOwner().getUser() != null) {
                        if (email.equalsIgnoreCase(apt.getPet().getOwner().getUser().getEmail())) {
                            return true;
                        }
                    }
                    // Check if user is the assigned vet
                    if (apt.getVet() != null && apt.getVet().getUser() != null) {
                        return email.equalsIgnoreCase(apt.getVet().getUser().getEmail());
                    }
                    return false;
                })
                .orElse(false);
    }

    /** true if the authenticated user is a vet in the specified clinic */
    public boolean isVetInClinic(Authentication auth, Long vetId, Long clinicId) {
        if (auth == null || !auth.isAuthenticated()) return false;

        // Admins can access any clinic
        if (hasAnyRole(auth, "SUPER_ADMIN", "CLINIC_ADMIN")) {
            return true;
        }

        String email = auth.getName();
        return vetRepository.findById(vetId)
                .map(vet -> vet.getUser() != null &&
                           email.equalsIgnoreCase(vet.getUser().getEmail()) &&
                           vet.getClinic() != null &&
                           vet.getClinic().getId().equals(clinicId))
                .orElse(false);
    }

    /** Helper method to check if user has any of the specified roles */
    private boolean hasAnyRole(Authentication auth, String... roles) {
        if (auth == null || auth.getAuthorities() == null) return false;
        for (String role : roles) {
            for (GrantedAuthority authority : auth.getAuthorities()) {
                String authName = authority.getAuthority();
                // Check both ROLE_XXX and XXX formats
                if (authName.equals("ROLE_" + role) || authName.equals(role)) {
                    return true;
                }
            }
        }
        return false;
    }
}
