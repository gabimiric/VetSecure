package com.vetsecure.backend.security.config;

import com.vetsecure.backend.config.TestJpaConfig;
import com.vetsecure.backend.testconfig.TestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(
    properties = {
        "spring.main.allow-bean-definition-overriding=true",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration,org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration"
    }
)
@AutoConfigureMockMvc
@org.springframework.context.annotation.Import({
    TestSecurityConfig.class,
    TestJpaConfig.class
})
public class SecurityConfigurationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void whenPublicEndpoint_thenSuccess() throws Exception {
        mockMvc.perform(get("/api/public/health"))
               .andExpect(status().isOk());
    }

    @Test
    public void whenUnauthenticated_thenRedirectToLogin() throws Exception {
        mockMvc.perform(get("/api/secured/data"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    public void whenAuthenticatedAsUser_thenSuccess() throws Exception {
        mockMvc.perform(get("/api/user/profile"))
               .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")
    public void whenUserAccessingAdminEndpoint_thenForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
               .andExpect(status().isForbidden());
    }

    @Test
    public void whenInvalidCsrf_thenForbidden() throws Exception {
        mockMvc.perform(post("/api/data")
               .contentType(MediaType.APPLICATION_JSON))
               .andExpect(status().isForbidden());
    }

    @Test
    public void whenMissingXssHeaders_thenHeadersPresent() throws Exception {
        mockMvc.perform(get("/api/public/health"))
               .andExpect(header().exists("X-XSS-Protection"))
               .andExpect(header().exists("X-Content-Type-Options"))
               .andExpect(header().exists("X-Frame-Options"));
    }
}