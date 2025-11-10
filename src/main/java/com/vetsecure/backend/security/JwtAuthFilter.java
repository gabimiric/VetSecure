package com.vetsecure.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.GrantedAuthority;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.vetsecure.backend.repository.UserRepository;
import com.vetsecure.backend.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Profile("!google")
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtService jwtService;
    private final UserDetailsServiceImpl uds;
    private final UserRepository usersRepo;

    public JwtAuthFilter(JwtService jwtService, UserDetailsServiceImpl uds, UserRepository usersRepo) {
        this.jwtService = jwtService;
        this.uds = uds;
        this.usersRepo = usersRepo;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {


        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7);
            try {
                var jws = jwtService.parse(token);
                var claims = jws.getBody();
                // Prefer explicit email claim; fall back to subject if necessary
                String email = null;
                try {
                    Object e = claims.get("email");
                    if (e != null) email = e.toString();
                } catch (Exception ignored) {}

                String subject = claims.getSubject();
                if (email == null || email.isBlank()) {
                    // subject may be numeric userId; we will try to resolve to an email
                    email = subject;
                }

                UserDetails ud = null;
                try {
                    ud = uds.loadUserByUsername(email);
                } catch (UsernameNotFoundException ex) {
                    // If loading by username/email failed and subject looks like a numeric userId,
                    // try resolving the user by ID and then load by their email.
                    try {
                        if (subject != null) {
                            long maybeId = Long.parseLong(subject);
                            java.util.Optional<User> uopt = usersRepo.findById(maybeId);
                            if (uopt.isPresent()) {
                                String resolvedEmail = uopt.get().getEmail();
                                ud = uds.loadUserByUsername(resolvedEmail);
                              }
                          }
                      } catch (NumberFormatException | UsernameNotFoundException ignored2) {
                          // leave ud null
                      }
                  }
                if (ud == null) {
                    logger.warn("JwtAuthFilter: user not found for token subject/claim (subject='{}', email='{}')", subject, email);
                    throw new RuntimeException("User not found for token subject/claim");
                }

                // Build authorities: include existing role authorities and map to SCOPE_* as needed
                Collection<? extends GrantedAuthority> existing = ud.getAuthorities();
                List<GrantedAuthority> authorities = new ArrayList<>();
                if (existing != null) {
                    authorities.addAll(new ArrayList<>(existing));
                }

                // If the user has ROLE_PET_OWNER, allow reading pets
                boolean isPetOwner = existing != null && existing.stream().anyMatch(a -> "ROLE_PET_OWNER".equals(a.getAuthority()));
                boolean isClinicAdmin = existing != null && existing.stream().anyMatch(a -> "ROLE_CLINIC_ADMIN".equals(a.getAuthority()) || "ROLE_SUPER_ADMIN".equals(a.getAuthority()));
                boolean isVetOrAssistant = existing != null && existing.stream().anyMatch(a -> "ROLE_VET".equals(a.getAuthority()) || "ROLE_ASSISTANT".equals(a.getAuthority()));

                if (isPetOwner) {
                    authorities.add(new SimpleGrantedAuthority("SCOPE_pets:read"));
                }
                if (isClinicAdmin || isVetOrAssistant) {
                    authorities.add(new SimpleGrantedAuthority("SCOPE_pets:read"));
                    authorities.add(new SimpleGrantedAuthority("SCOPE_pets:write"));
                }

                var authToken = new UsernamePasswordAuthenticationToken(ud, null, authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                logger.debug("JwtAuthFilter: authenticated user='{}' with authorities={}", ud.getUsername(), authorities);
            } catch (Exception e) {
                logger.error("JwtAuthFilter: token parsing/authentication failed", e);  // ← Log full exception
            }
            logger.info("JwtAuthFilter: processing request to {}, Authorization header present: {}",
                    req.getRequestURI(), auth != null);
         }
         chain.doFilter(req, res);
     }
 }
