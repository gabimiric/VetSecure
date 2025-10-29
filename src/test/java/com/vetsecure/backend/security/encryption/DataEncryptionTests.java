package com.vetsecure.backend.security.encryption;

import com.vetsecure.backend.model.Clinic;
import com.vetsecure.backend.model.PetOwner;
import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.ClinicRepository;
import com.vetsecure.backend.repository.PetOwnerRepository;
import com.vetsecure.backend.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = {
    com.vetsecure.backend.BackendApplication.class,
    com.vetsecure.backend.testconfig.TestSecurityConfig.class,
    com.vetsecure.backend.config.TestJpaConfig.class
})
@ActiveProfiles("test")
public class DataEncryptionTests {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PetOwnerRepository petOwnerRepository;

    @Autowired
    private ClinicRepository clinicRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @Transactional
    void testPetOwnerEncryption() {
        // Create test user
        User user = new User();
        user.setEmail("testowner@example.com");
        user.setUsername("testowner");
        user.setPasswordHash(passwordEncoder.encode("password"));
        userRepository.save(user);

        // Create PetOwner with sensitive data
        PetOwner owner = new PetOwner();
        owner.setUser(user);
        owner.setFirstName("Test");
        owner.setLastName("Owner");
        owner.setPhone("+1234567890");
        owner.setAddress("123 Secret Street, Test City");
        
        // Save and flush to ensure it's written to the database
        petOwnerRepository.save(owner);
        entityManager.flush();
        entityManager.clear();

        // Retrieve from database
        PetOwner retrievedOwner = petOwnerRepository.findById(owner.getId()).orElseThrow();
        
        // Verify the sensitive data is correctly decrypted
        assertEquals(owner.getPhone(), retrievedOwner.getPhone());
        assertEquals(owner.getAddress(), retrievedOwner.getAddress());
        
        // Verify raw database values are encrypted
        String rawPhoneQuery = String.format(
            "SELECT phone FROM pet_owners WHERE id = %d", owner.getId());
        String rawPhone = (String) entityManager.createNativeQuery(rawPhoneQuery)
            .getSingleResult();
        
        assertNotEquals(owner.getPhone(), rawPhone);
        assertTrue(rawPhone.length() > owner.getPhone().length());
    }

    @Test
    @Transactional
    void testClinicEncryption() {
        // Create test clinic admin
        User admin = new User();
        admin.setEmail("clinicadmin@example.com");
        admin.setUsername("clinicadmin");
        admin.setPasswordHash(passwordEncoder.encode("password"));
        userRepository.save(admin);

        // Create Clinic with sensitive data
        Clinic clinic = new Clinic();
        clinic.setClinicAdmin(admin);
        clinic.setName("Test Clinic");
        clinic.setAddress("456 Private Road, Medical District");
        clinic.setPhone("+1987654321");
        clinic.setEmail("clinic@example.com");
        clinic.setCity("Test City");
        
        // Save and flush
        clinicRepository.save(clinic);
        entityManager.flush();
        entityManager.clear();

        // Retrieve from database
        Clinic retrievedClinic = clinicRepository.findById(clinic.getId()).orElseThrow();
        
        // Verify the sensitive data is correctly decrypted
        assertEquals(clinic.getAddress(), retrievedClinic.getAddress());
        assertEquals(clinic.getPhone(), retrievedClinic.getPhone());
        assertEquals(clinic.getEmail(), retrievedClinic.getEmail());
        
        // Verify raw database values are encrypted
        String rawAddressQuery = String.format(
            "SELECT address FROM clinics WHERE id = %d", clinic.getId());
        String rawAddress = (String) entityManager.createNativeQuery(rawAddressQuery)
            .getSingleResult();
        
        assertNotEquals(clinic.getAddress(), rawAddress);
        assertTrue(rawAddress.length() > clinic.getAddress().length());
    }
}