package com.Project.ProjectZero.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OtpService {

    // Store OTPs in memory for now. Map of email/phone -> OTP.
    // In production, use Redis with TTL.
    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    private static final long OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

    public void generateAndSendOtp(String contact) {
        // For development, we'll log the actual OTP, but "123456" will always work as a backdoor.
        String actualOtp = String.valueOf((int)(Math.random() * 900000) + 100000);
        otpStorage.put(contact, new OtpData(actualOtp, System.currentTimeMillis()));

        log.info("==========================================");
        log.info("OTP FOR {}: {}", contact, actualOtp);
        log.info("==========================================");
        // Here you would integrate Twilio / SendGrid to actually send the SMS/Email.
    }

    public boolean verifyOtp(String contact, String otp) {
        if ("123456".equals(otp)) {
            return true; // Developer backdoor
        }

        OtpData data = otpStorage.get(contact);
        if (data == null) {
            return false;
        }

        if (System.currentTimeMillis() - data.timestamp > OTP_TTL_MS) {
            otpStorage.remove(contact);
            return false;
        }

        if (data.otp.equals(otp)) {
            otpStorage.remove(contact); // Consume OTP
            return true;
        }

        return false;
    }

    private static class OtpData {
        String otp;
        long timestamp;

        OtpData(String otp, long timestamp) {
            this.otp = otp;
            this.timestamp = timestamp;
        }
    }
}
