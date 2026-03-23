// src/main/java/com/daansetu/service/SmsService.java
package com.daansetu.service;

import com.daansetu.entity.OtpRecord;
import com.daansetu.entity.SmsLog;
import com.daansetu.exception.BadRequestException;
import com.daansetu.repository.OtpRepository;
import com.daansetu.repository.SmsLogRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

    private final OtpRepository otpRepository;
    private final SmsLogRepository smsLogRepository;
    private final RestTemplate restTemplate;

    @Value("${app.otp.expiry-minutes:10}")
    private int otpExpiryMinutes;

    @Value("${app.otp.length:6}")
    private int otpLength;

    @Value("${app.otp.max-attempts:3}")
    private int maxAttempts;

    @Value("${app.sms.enabled:true}")
    private boolean smsEnabled;

    @Value("${app.sms.simulate:false}")
    private boolean simulateSms;

    @Value("${app.sms.default-country-code:91}")
    private String defaultCountryCode;

    @Value("${fast2sms.api.key:}")
    private String fast2SmsApiKey;

    @Value("${fast2sms.url:https://www.fast2sms.com/dev/bulkV2}")
    private String fast2SmsUrl;

    @Value("${app.sms.fallback-to-simulate:false}")
    private boolean fallbackToSimulate;

    private volatile boolean fast2SmsReady = false;

    @PostConstruct
    void initProvider() {
        if (!smsEnabled) {
            log.info("SMS sending disabled by configuration (app.sms.enabled=false)");
            return;
        }

        if (simulateSms) {
            log.warn("SMS simulation mode is enabled (app.sms.simulate=true). No real SMS will be delivered.");
            return;
        }

        if (!StringUtils.hasText(fast2SmsApiKey) || !StringUtils.hasText(fast2SmsUrl)) {
            log.error("Fast2SMS configuration is incomplete. Set fast2sms.api.key and fast2sms.url.");
            return;
        }

        fast2SmsReady = true;
        log.info("Fast2SMS provider initialized successfully. Endpoint: {}", fast2SmsUrl.trim());
        if (fallbackToSimulate) {
            log.warn("app.sms.fallback-to-simulate=true: non-OTP messages may be simulated on provider failure.");
        }
    }

    // ============================================
    // SEND OTP
    // ============================================
    @Transactional
    public String sendOtp(String phone, OtpRecord.OtpPurpose purpose) {
        String normalizedPhone = normalizePhone(phone);

        // Check cooldown
        otpRepository.findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(normalizedPhone, purpose)
                .ifPresent(existing -> {
                    if (existing.getCreatedAt().plusSeconds(60).isAfter(LocalDateTime.now())) {
                        throw new BadRequestException("Please wait before requesting another OTP");
                    }
                });

        String otp = generateOtp();

        OtpRecord otpRecord = OtpRecord.builder()
                .phone(normalizedPhone)
                .otp(otp)
                .purpose(purpose)
                .expiryDate(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
                .build();
        otpRepository.save(otpRecord);

        // OTP must be delivered via the real provider in strict mode.
        String message = buildOtpMessage(otp, purpose);
        sendSms(normalizedPhone, message, purpose.name(), true);

        log.info("OTP sent to {} for purpose: {}", maskPhone(normalizedPhone), purpose);
        return "OTP sent successfully to " + maskPhone(normalizedPhone);
    }

    // ============================================
    // VERIFY OTP
    // ============================================
    @Transactional
    public boolean verifyOtp(String phone, String otp, OtpRecord.OtpPurpose purpose) {
        String normalizedPhone = normalizePhone(phone);

        OtpRecord otpRecord = otpRepository
                .findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(normalizedPhone, purpose)
                .orElseThrow(() -> new BadRequestException("No OTP found. Please request a new one."));

        if (otpRecord.isExpired()) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        if (otpRecord.getAttempts() >= maxAttempts) {
            throw new BadRequestException("Maximum OTP attempts exceeded. Please request a new one.");
        }

        otpRecord.setAttempts(otpRecord.getAttempts() + 1);

        if (!otpRecord.getOtp().equals(otp)) {
            otpRepository.save(otpRecord);
            throw new BadRequestException("Invalid OTP. " + (maxAttempts - otpRecord.getAttempts()) + " attempts remaining.");
        }

        otpRecord.setVerified(true);
        otpRepository.save(otpRecord);

        log.info("OTP verified successfully for {} - purpose: {}", maskPhone(normalizedPhone), purpose);
        return true;
    }

    // ============================================
    // SEND DONATION CONFIRMATION SMS
    // ============================================
    @Async
    public void sendDonationConfirmation(String phone, String donorName, String amount,
                                         String campaign, String receiptNumber) {
        String message = String.format(
                "🎉 DaanSetu: Dear %s, your donation of ₹%s to \"%s\" is confirmed! " +
                        "Receipt: %s. Thank you for making a difference! 🙏",
                donorName, amount, campaign, receiptNumber
        );
        sendSms(phone, message, "DONATION_CONFIRM", false);
    }

    // ============================================
    // SEND PICKUP REMINDER SMS
    // ============================================
    @Async
    public void sendPickupReminder(String phone, String donorName, String date,
                                   String timeSlot, String address) {
        String message = String.format(
                "📦 DaanSetu Pickup Reminder: Hi %s, your donation pickup is scheduled for %s (%s) at %s. " +
                        "Our volunteer will contact you. Thank you! 🤝",
                donorName, date, timeSlot, address
        );
        sendSms(phone, message, "PICKUP_REMINDER", false);
    }

    // ============================================
    // CORE SMS SEND  (returns true = real SMS sent, false = simulated / fallback)
    // ============================================
    private boolean sendSms(String phone, String message, String purpose, boolean failFast) {
        String normalizedPhone = normalizePhone(phone);

        SmsLog smsLog = SmsLog.builder()
                .phoneNumber(normalizedPhone)
                .message(message)
                .purpose(purpose)
                .status(SmsLog.SmsStatus.QUEUED)
                .build();

        if (!smsEnabled) {
            smsLog.setStatus(SmsLog.SmsStatus.FAILED);
            smsLog.setErrorMessage("SMS sending disabled by configuration.");
            smsLogRepository.save(smsLog);
            log.info("SMS sending skipped for {} [{}] because app.sms.enabled=false", maskPhone(normalizedPhone), purpose);
            if (failFast) {
                throw new BadRequestException("SMS service is currently unavailable. Please try again later.");
            }
            return false;
        }

        boolean realSmsSent = false;
        try {
            if (simulateSms) {
                String simulateError = "SMS simulate mode is enabled. Disable app.sms.simulate for real OTP delivery.";
                if (failFast) {
                    smsLog.setStatus(SmsLog.SmsStatus.FAILED);
                    smsLog.setErrorMessage(simulateError);
                } else {
                    log.warn("SIMULATED SMS to {} [{}]: {}", maskPhone(normalizedPhone), purpose,
                            message.substring(0, Math.min(60, message.length())) + "...");
                    smsLog.setStatus(SmsLog.SmsStatus.SENT);
                    smsLog.setSentAt(LocalDateTime.now());
                    smsLog.setProviderSid("SIM_" + System.currentTimeMillis());
                }
            } else {
                if (!fast2SmsReady) {
                    throw new IllegalStateException("Fast2SMS provider not initialized. Check SMS configuration.");
                }

                String providerReference = sendViaFast2Sms(normalizedPhone, message);

                smsLog.setStatus(SmsLog.SmsStatus.SENT);
                smsLog.setSentAt(LocalDateTime.now());
                smsLog.setProviderSid(providerReference);
                log.info("SMS submitted to Fast2SMS for {} [{}], requestId={}",
                        maskPhone(normalizedPhone), purpose, providerReference);
                realSmsSent = true;
            }
        } catch (Exception e) {
            if (!failFast && fallbackToSimulate && !simulateSms) {
                // Fast2SMS unavailable — log full message so OTP is visible in server logs
                log.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                log.warn("SMS FALLBACK-SIMULATE (Fast2SMS error: {})", e.getMessage());
                log.warn(">>> TO: {}  PURPOSE: {}  MESSAGE: {}", maskPhone(normalizedPhone), purpose, message);
                log.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                smsLog.setStatus(SmsLog.SmsStatus.SENT);
                smsLog.setSentAt(LocalDateTime.now());
                smsLog.setProviderSid("FALLBACK_SIM_" + System.currentTimeMillis());
                // realSmsSent remains false — fallback mode
            } else {
                smsLog.setStatus(SmsLog.SmsStatus.FAILED);
                smsLog.setErrorMessage(e.getMessage());
                log.error("Failed to send SMS to {} [{}]: {}", maskPhone(normalizedPhone), purpose, e.getMessage());
            }
        }

        smsLogRepository.save(smsLog);

        if (failFast && smsLog.getStatus() != SmsLog.SmsStatus.SENT) {
            String reason = StringUtils.hasText(smsLog.getErrorMessage())
                    ? smsLog.getErrorMessage()
                    : "Unable to send OTP SMS right now. Please try again in a minute.";
            throw new BadRequestException(reason);
        }

        return realSmsSent;
    }

    private String sendViaFast2Sms(String normalizedPhone, String message) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("authorization", fast2SmsApiKey.trim());
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        MultiValueMap<String, String> payload = new LinkedMultiValueMap<>();
        payload.add("route", "q");
        payload.add("language", "english");
        payload.add("flash", "0");
        payload.add("numbers", extractDigits(normalizedPhone));
        payload.add("message", message);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    fast2SmsUrl.trim(),
                    new HttpEntity<>(payload, headers),
                    String.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new IllegalStateException("Fast2SMS HTTP " + response.getStatusCode().value() + ": "
                        + summarizeResponse(response.getBody()));
            }

            String responseBody = response.getBody();
            if (containsExplicitFailure(responseBody)) {
                throw new IllegalStateException("Fast2SMS rejected request: " + summarizeResponse(responseBody));
            }

            return extractProviderReference(responseBody);
        } catch (HttpClientErrorException e) {
            // 4xx from Fast2SMS — e.getResponseBodyAsString() carries the real JSON error
            String body = e.getResponseBodyAsString();
            throw new IllegalStateException(
                    "Fast2SMS HTTP " + e.getStatusCode().value() + ": " + summarizeResponse(body), e);
        } catch (RestClientException e) {
            throw new IllegalStateException("Fast2SMS network error: " + e.getMessage(), e);
        }
    }

    private boolean containsExplicitFailure(String responseBody) {
        if (!StringUtils.hasText(responseBody)) {
            return false;
        }

        String normalized = responseBody.toLowerCase();
        return normalized.contains("\"return\":false")
                || normalized.contains("\"return\": false")
                || normalized.contains("\"status\":\"error\"")
                || normalized.contains("\"message\":\"invalid")
                || normalized.contains("\"message\": \"invalid");
    }

    private String extractProviderReference(String responseBody) {
        if (!StringUtils.hasText(responseBody)) {
            return "FAST2SMS_" + System.currentTimeMillis();
        }

        for (String patternText : List.of(
                "\\\"request_id\\\"\\s*:\\s*\\\"([^\\\"]+)\\\"",
                "\\\"message_id\\\"\\s*:\\s*\\\"([^\\\"]+)\\\"",
                "\\\"id\\\"\\s*:\\s*\\\"([^\\\"]+)\\\""
        )) {
            Matcher matcher = Pattern.compile(patternText).matcher(responseBody);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }

        return "FAST2SMS_" + System.currentTimeMillis();
    }

    private String summarizeResponse(String responseBody) {
        if (!StringUtils.hasText(responseBody)) {
            return "No response body returned";
        }

        String sanitized = responseBody.replaceAll("\\s+", " ").trim();
        return sanitized.length() > 180 ? sanitized.substring(0, 177) + "..." : sanitized;
    }

    private String extractDigits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private String normalizePhone(String phone) {
        String raw = phone == null ? "" : phone.trim();
        if (raw.isEmpty()) {
            throw new BadRequestException("Phone number is required");
        }

        if (raw.startsWith("+")) {
            return raw;
        }

        String digits = raw.replaceAll("\\D", "");
        if (digits.startsWith("0")) {
            digits = digits.substring(1);
        }

        if (digits.length() == 10) {
            return "+" + defaultCountryCode + digits;
        }

        if (digits.startsWith(defaultCountryCode)) {
            return "+" + digits;
        }

        return "+" + digits;
    }

    private String generateOtp() {
        Random random = new Random();
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < otpLength; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }

    private String buildOtpMessage(String otp, OtpRecord.OtpPurpose purpose) {
        return switch (purpose) {
            case LOGIN -> String.format("DaanSetu: Your login OTP is %s. Valid for %d minutes. Do not share this code.", otp, otpExpiryMinutes);
            case REGISTER -> String.format("DaanSetu: Your verification OTP is %s. Valid for %d minutes.", otp, otpExpiryMinutes);
            case RESET_PASSWORD -> String.format("DaanSetu: Your password reset OTP is %s. Valid for %d minutes.", otp, otpExpiryMinutes);
            case VERIFY_PHONE -> String.format("DaanSetu: Your phone verification OTP is %s. Valid for %d minutes.", otp, otpExpiryMinutes);
            default -> String.format("DaanSetu: Your OTP is %s. Valid for %d minutes.", otp, otpExpiryMinutes);
        };
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 6) return "****";
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 3);
    }
}
