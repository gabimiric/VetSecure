package com.vetsecure.backend;

import com.vetsecure.backend.model.Role;
import com.vetsecure.backend.repository.RoleRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    CommandLineRunner syncRoles(RoleRepository roleRepository) {
        return args -> {
            for (Role.RoleType type : Role.RoleType.values()) {
                roleRepository.findByName(type)
                        .orElseGet(() -> roleRepository.save(new Role(type)));
            }
        };
    }

    // Quick verification that Spring can connect to MySQL
    @org.springframework.context.annotation.Bean
    CommandLineRunner dbPing(DataSource ds) {
        return args -> {
            try (Connection c = ds.getConnection();
                 ResultSet rs = c.createStatement().executeQuery("SELECT DATABASE() db, VERSION() v")) {
                if (rs.next()) {
                    System.out.println("✅ Connected to MySQL -> db=" + rs.getString("db")
                            + ", version=" + rs.getString("v"));
                }
            }
        };
    }
}