package com.vetsecure.backend.security;

import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.UserRepository;

import org.springframework.context.annotation.Profile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;
@Profile("!oauth")
@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UserRepository users;

    public UserDetailsServiceImpl(UserRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User u = users.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("No user " + email));

        // enum -> "ROLE_SUPER_ADMIN"
        String roleName = "ROLE_" + u.getRole().getName();

        return new org.springframework.security.core.userdetails.User(
                u.getEmail(),
                u.getPasswordHash(),
                List.of(new SimpleGrantedAuthority(roleName))
        );
    }
}

