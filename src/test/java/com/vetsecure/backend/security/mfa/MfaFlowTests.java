package com.vetsecure.backend.security.mfa;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vetsecure.backend.model.User;
import com.vetsecure.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class MfaFlowTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MfaService mfaService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private final String TEST_PASSWORD = "TestPassword123!";

    @BeforeEach
    void setUp() {
        // Clean up test user if exists
        userRepository.findByEmail("test@example.com").ifPresent(userRepository::delete);

        // Create test user
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setUsername("testuser");
        testUser.setPasswordHash(passwordEncoder.encode(TEST_PASSWORD));
        testUser = userRepository.save(testUser);
    }

    @Test
    void testCompleteMfaFlow() throws Exception {
        // Step 1: Login without MFA
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", testUser.getEmail(),
                    "password", TEST_PASSWORD
                ))))
                .andExpect(status().isOk())
                .andReturn();

        String initialToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("token").asText();
        assertNotNull(initialToken, "Should get access token for non-MFA user");

        // Step 2: Setup MFA
        MvcResult setupResult = mockMvc.perform(post("/auth/mfa/setup")
                .header("Authorization", "Bearer " + initialToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        var setupResponse = objectMapper.readTree(setupResult.getResponse().getContentAsString());
        String secret = setupResponse.get("secret").asText();
        assertNotNull(secret, "Should get MFA secret");

        // Generate a valid TOTP code using the secret
        String validCode = generateValidTotp(secret);

        // Step 3: Verify MFA Setup
        mockMvc.perform(post("/auth/mfa/verify-setup")
                .header("Authorization", "Bearer " + initialToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("code", validCode))))
                .andExpect(status().isOk());

        // Verify MFA is enabled
        testUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertTrue(testUser.isMfaEnabled(), "MFA should be enabled after verification");

        // Step 4: Try login with MFA enabled
        MvcResult mfaLoginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "email", testUser.getEmail(),
                    "password", TEST_PASSWORD
                ))))
                .andExpect(status().isOk())
                .andReturn();

        var mfaResponse = objectMapper.readTree(mfaLoginResult.getResponse().getContentAsString());
        assertTrue(mfaResponse.get("mfaRequired").asBoolean(), "MFA challenge should be required");
        String mfaToken = mfaResponse.get("mfaToken").asText();
        assertNotNull(mfaToken, "Should get MFA token");

        // Step 5: Complete MFA verification
        String newValidCode = generateValidTotp(secret);
        MvcResult verifyResult = mockMvc.perform(post("/auth/mfa/verify-login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "mfaToken", mfaToken,
                    "code", newValidCode
                ))))
                .andExpect(status().isOk())
                .andReturn();

        var finalResponse = objectMapper.readTree(verifyResult.getResponse().getContentAsString());
        assertNotNull(finalResponse.get("accessToken").asText(), "Should get access token after MFA");
        assertNotNull(finalResponse.get("refreshToken").asText(), "Should get refresh token after MFA");

        // Step 6: Test MFA disable
        String finalToken = finalResponse.get("accessToken").asText();
        String finalValidCode = generateValidTotp(secret);
        
        mockMvc.perform(post("/auth/mfa/disable")
                .header("Authorization", "Bearer " + finalToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "password", TEST_PASSWORD,
                    "code", finalValidCode
                ))))
                .andExpect(status().isOk());

        // Verify MFA is disabled
        testUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertFalse(testUser.isMfaEnabled(), "MFA should be disabled");
        assertNull(testUser.getMfaSecret(), "MFA secret should be cleared");
        assertNull(testUser.getMfaRecoveryHashes(), "Recovery codes should be cleared");
    }

    private String generateValidTotp(String secret) {
        return mfaService.generateCurrentTotp(secret);
    }
}