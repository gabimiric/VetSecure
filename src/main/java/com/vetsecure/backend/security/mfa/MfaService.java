package com.vetsecure.backend.security.mfa;

import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class MfaService {

    public static final String ISSUER = "VetSecure";
    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    /** Generate a Base32 secret (what Google Authenticator expects). */
    public String generateSecret() {
        return new DefaultSecretGenerator().generate(); // Base32
    }

    /** Build otpauth:// URI (works with GA/Authy, etc.). */
    public String buildOtpAuthUrl(String email, String base32Secret) {
        QrData data = new QrData.Builder()
                .label(ISSUER + ":" + email)
                .secret(base32Secret)
                .issuer(ISSUER)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
        return data.getUri();
    }

    /** PNG QR as data URL for easy display. */
    public String qrPngBase64(String email, String base32Secret, int size) throws Exception {
        QrData data = new QrData.Builder()
                .label(ISSUER + ":" + email)
                .secret(base32Secret)
                .issuer(ISSUER)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
        byte[] png = new ZxingPngQrGenerator().generate(data);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(png);
    }

    /** Verify a 6-digit code with ±1 step (±30s) tolerance. */
    public boolean verify(String base32Secret, String code) {
        var verifier = new DefaultCodeVerifier(
                new DefaultCodeGenerator(HashingAlgorithm.SHA1),
                new SystemTimeProvider()
        );
        verifier.setAllowedTimePeriodDiscrepancy(1);
        return verifier.isValidCode(base32Secret, code);
    }

    // ---------- Recovery codes helpers ----------

    /** 10 human-readable recovery codes, e.g. 12345-67890. */
    public List<String> generateRecoveryCodesPlain() {
        var r = new Random();
        return r.ints(10, 0, 1_000_000_000)
                .mapToObj(i -> String.format("%05d-%05d", i % 100000, (i / 100000) % 100000))
                .collect(Collectors.toList());
    }

    /** Store hashed (one per line). */
    public String hashRecoveryCodesForStorage(List<String> plain) {
        return plain.stream().map(bcrypt::encode).collect(Collectors.joining("\n"));
    }

    /**
     * Try to consume a recovery code. If valid, returns the updated hashes string
     * (with the used code removed). If invalid, returns null.
     */
    public String consumeRecoveryCode(String storedHashes, String providedCode) {
        if (storedHashes == null || storedHashes.isBlank() || providedCode == null) return null;
        var lines = storedHashes.split("\\R");
        int matchIdx = -1;
        for (int i = 0; i < lines.length; i++) {
            if (bcrypt.matches(providedCode, lines[i])) { matchIdx = i; break; }
        }
        if (matchIdx < 0) return null; // not found

        // remove matched line
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < lines.length; i++) {
            if (i == matchIdx) continue;
            if (sb.length() > 0) sb.append("\n");
            sb.append(lines[i]);
        }
        return sb.toString();
    }
}
