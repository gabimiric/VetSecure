package com.vetsecure.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(BackendApplication.class);
        
        // Set dev profile as default if no profile is specified
        // This allows IDE runs to work without SSL keystore issues
        String activeProfile = System.getProperty("spring.profiles.active");
        if (activeProfile == null || activeProfile.isEmpty()) {
            app.setDefaultProperties(java.util.Map.of("spring.profiles.active", "dev"));
        }
        
        app.run(args);
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