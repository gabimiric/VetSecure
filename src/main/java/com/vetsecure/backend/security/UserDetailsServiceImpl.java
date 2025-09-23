package com.vetsecure.backend.security;

import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UserRepository users;

    public UserDetailsServiceImpl(UserRepository users) { this.users = users; }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User u = users.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("No user " + email));
        String roleName = "ROLE_" + u.getRole().getName().name(); // e.g. ROLE_SUPER_ADMIN
        return new org.springframework.security.core.userdetails.User(
                u.getEmail(),               // principal = email
                u.getPasswordHash(),        // BCrypt
                List.of(new SimpleGrantedAuthority(roleName))
        );
    }
}
