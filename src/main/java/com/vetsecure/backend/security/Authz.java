package com.vetsecure.backend.security;

import com.vetsecure.backend.repository.PetOwnerRepository;

import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
@Profile("!oauth")
@Component("authz") // used in @PreAuthorize as @authz
public class Authz {

    private final PetOwnerRepository owners;

    public Authz(PetOwnerRepository owners) {
        this.owners = owners;
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
}
