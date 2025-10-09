package com.vetsecure.backend.security;

import com.vetsecure.backend.model.Role;
import com.vetsecure.backend.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.List;

public class UserPrincipal implements Authentication {
    private final Long userId;
    private final Role.RoleType role;  // single role
    private boolean authenticated = true;

    public UserPrincipal(Long userId, Role.RoleType role) {
        this.userId = userId;
        this.role = role;
    }

    public static UserPrincipal fromUser(User u) {
        return new UserPrincipal(u.getId(), u.getRole().getName());
    }

    public Long getUserId() { return userId; }
    public Role.RoleType getRole() { return role; }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override public Object getCredentials() { return null; }
    @Override public Object getDetails() { return null; }
    @Override public Object getPrincipal() { return this; }
    @Override public boolean isAuthenticated() { return authenticated; }
    @Override public void setAuthenticated(boolean isAuthenticated) { this.authenticated = isAuthenticated; }
    @Override public String getName() { return String.valueOf(userId); }
}
