package com.vetsecure.backend;

import com.vetsecure.backend.security.mfa.MfaService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class BackendApplicationTests {

	@Test
	void testTotpGenerationAndVerification() {
		MfaService mfa = new MfaService();

		// Use a fixed secret for repeatability
		String secret = "5D4Z47K5AEPDSKUQQVHXWBSZUMGLOFSD";
		System.out.println("🔑 Secret (use in Google Authenticator): " + secret);

		// Print what QR code you’d use (optional)
		try {
			String qr = mfa.qrPngBase64("test@vetsecure.com", secret, 200);
			System.out.println("🧩 QR (Base64): " + qr.substring(0, 80) + "...");
		} catch (Exception e) {
			e.printStackTrace();
		}

		// Replace with the current 6-digit code from Google Authenticator
		boolean ok = mfa.verify(secret, "048756");
		System.out.println("✅ Verification result: " + ok);

		assertTrue(ok, "Code should verify correctly");
	}
}




