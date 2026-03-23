// src/main/java/com/daansetu/controller/AuthController.java
package com.daansetu.controller;

import com.daansetu.dto.request.LoginRequest;
import com.daansetu.dto.request.RegisterRequest;
import com.daansetu.dto.response.ApiResponse;
import com.daansetu.dto.response.AuthResponse;
import com.daansetu.entity.*;
import com.daansetu.enums.UserRole;
import com.daansetu.exception.*;
import com.daansetu.repository.*;
import com.daansetu.security.JwtTokenProvider;
import com.daansetu.service.EmailService;
import com.daansetu.service.SmsService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;
    private final SmsService smsService;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final OtpRepository otpRepository;
    private final EmailLogRepository emailLogRepository;
    private final SmsLogRepository smsLogRepository;

    // ============================================
    // REGISTER
    // ============================================
    @PostMapping("/register")
    @Transactional
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException("Account already exists");
        }

        User user = User.builder()
                .name(request.getName())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .city(request.getCity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .role(request.getRole())
                .active(true)
                .emailVerified(false)
                .phoneVerified(false)
                .build();

        user = userRepository.save(user);

        // OTP-only verification flow
        emailService.sendVerificationOtpEmail(user);

        String token = tokenProvider.generateToken(user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());

        AuthResponse response = buildAuthResponse(user, token, refreshToken);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful. Verify your email using the OTP sent to Gmail.", response));
    }

    // ============================================
    // LOGIN (Email/Password)
    // ============================================
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        String rawPassword = request.getPassword();
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, rawPassword)
        );

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        String token = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());

        AuthResponse response = buildAuthResponse(user, token, refreshToken);

        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    // ============================================
    // LOGIN / REGISTER (Google)
    // ============================================
    @PostMapping("/google")
    @Transactional
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithGoogle(@Valid @RequestBody GoogleAuthRequest request) {
        GoogleProfile profile = request.getProfile();
        String email = profile.getEmail().trim().toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseGet(() -> userRepository.save(User.builder()
                        .name(profile.getName().trim())
                        .email(email)
                        .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .role(UserRole.DONOR)
                        .active(true)
                        .emailVerified(true)
                        .phoneVerified(false)
                        .profileImage(profile.getPicture())
                        .build()));

        if ((user.getProfileImage() == null || user.getProfileImage().isBlank())
                && profile.getPicture() != null
                && !profile.getPicture().isBlank()) {
            user.setProfileImage(profile.getPicture());
        }

        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
        }

        userRepository.save(user);

        String token = tokenProvider.generateToken(user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());

        AuthResponse response = buildAuthResponse(user, token, refreshToken);

        return ResponseEntity.ok(ApiResponse.success("Google login successful", response));
    }

    // ============================================
    // SEND OTP FOR LOGIN
    // ============================================
    @PostMapping("/otp/send")
    public ResponseEntity<ApiResponse<String>> sendOtp(@Valid @RequestBody OtpRequest request) {
        String result = smsService.sendOtp(request.getPhone(), OtpRecord.OtpPurpose.LOGIN);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ============================================
    // VERIFY OTP AND LOGIN
    // ============================================
    @PostMapping("/otp/verify")
    @Transactional
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtpLogin(@Valid @RequestBody OtpVerifyRequest request) {
        smsService.verifyOtp(request.getPhone(), request.getOtp(), OtpRecord.OtpPurpose.LOGIN);

        User user = userRepository.findByEmail(request.getPhone())
                .or(() -> userRepository.findAll().stream()
                        .filter(u -> request.getPhone().equals(u.getPhone()))
                        .findFirst())
                .orElseThrow(() -> new ResourceNotFoundException("User", "phone", request.getPhone()));

        if (!user.isPhoneVerified()) {
            user.setPhoneVerified(true);
            userRepository.save(user);
        }

        String token = tokenProvider.generateToken(user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());

        AuthResponse response = buildAuthResponse(user, token, refreshToken);

        return ResponseEntity.ok(ApiResponse.success("OTP verified. Login successful.", response));
    }

    // ============================================
    // SEND EMAIL VERIFICATION OTP
    // ============================================
    @PostMapping("/email/send-otp")
    public ResponseEntity<ApiResponse<String>> sendEmailVerificationOtp(@Valid @RequestBody EmailRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", normalizedEmail));

        if (user.isEmailVerified()) {
            throw new BadRequestException("Email is already verified.");
        }

        emailService.sendVerificationOtpEmail(user);
        return ResponseEntity.ok(ApiResponse.success("Verification OTP sent to your email."));
    }

    // ============================================
    // VERIFY EMAIL OTP
    // ============================================
    @PostMapping("/email/verify-otp")
    @Transactional
    public ResponseEntity<ApiResponse<String>> verifyEmailOtp(@Valid @RequestBody ResetOtpVerifyRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", normalizedEmail));

        OtpRecord otpRecord = otpRepository
                .findTopByEmailAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(normalizedEmail, OtpRecord.OtpPurpose.VERIFY_EMAIL)
                .orElseThrow(() -> new BadRequestException("No email OTP found. Please request a new one."));

        if (otpRecord.isExpired()) {
            throw new BadRequestException("Email OTP has expired. Please request a new one.");
        }

        if (otpRecord.getAttempts() >= 3) {
            throw new BadRequestException("Maximum OTP attempts exceeded. Please request a new one.");
        }

        otpRecord.setAttempts(otpRecord.getAttempts() + 1);
        if (!otpRecord.getOtp().equals(request.getOtp())) {
            otpRepository.save(otpRecord);
            throw new BadRequestException("Invalid OTP. Please check the code and try again.");
        }

        otpRecord.setVerified(true);
        otpRepository.save(otpRecord);

        user.setEmailVerified(true);
        userRepository.save(user);

        var activeVerificationTokens = verificationTokenRepository
                .findAllByUserUserIdAndUsedFalseOrderByCreatedAtDesc(user.getUserId());
        activeVerificationTokens.forEach(token -> token.setUsed(true));
        if (!activeVerificationTokens.isEmpty()) {
            verificationTokenRepository.saveAll(activeVerificationTokens);
        }

        return ResponseEntity.ok(ApiResponse.success("Email verified successfully!"));
    }

    // ============================================
    // SEND PHONE VERIFICATION OTP (post-registration)
    // ============================================
    @PostMapping("/phone/send-otp")
    public ResponseEntity<ApiResponse<String>> sendPhoneVerificationOtp(@Valid @RequestBody OtpRequest request) {
        String result = smsService.sendOtp(request.getPhone(), OtpRecord.OtpPurpose.VERIFY_PHONE);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ============================================
    // VERIFY PHONE OTP (post-registration)
    // ============================================
    @PostMapping("/phone/verify-otp")
    @Transactional
    public ResponseEntity<ApiResponse<String>> verifyPhoneOtp(@Valid @RequestBody OtpVerifyRequest request) {
        smsService.verifyOtp(request.getPhone(), request.getOtp(), OtpRecord.OtpPurpose.VERIFY_PHONE);

        // Find user by phone
        String digits = request.getPhone().replaceAll("\\D", "");
        User user = userRepository.findAll().stream()
                .filter(u -> u.getPhone() != null && u.getPhone().replaceAll("\\D", "").endsWith(
                        digits.length() > 10 ? digits.substring(digits.length() - 10) : digits))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("User", "phone", request.getPhone()));

        if (user.isPhoneVerified()) {
            return ResponseEntity.ok(ApiResponse.success("Phone is already verified."));
        }

        user.setPhoneVerified(true);
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.success("Phone number verified successfully!"));
    }

    // ============================================
    // VERIFY EMAIL (link verification disabled; OTP only flow)
    // ============================================
    @GetMapping("/verify-email")
    @Transactional
    public ResponseEntity<ApiResponse<String>> verifyEmail(@RequestParam String token) {
        throw new BadRequestException("Email link verification is disabled. Please verify using the 6-digit OTP.");
    }

    // ============================================
    // RESEND VERIFICATION OTP
    // ============================================
    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<String>> resendVerification(@RequestBody EmailRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", normalizedEmail));

        if (user.isEmailVerified()) {
            throw new BadRequestException("Email is already verified.");
        }

        emailService.sendVerificationOtpEmail(user);
        return ResponseEntity.ok(ApiResponse.success("Verification OTP sent to your email."));
    }

    // ============================================
    // FORGOT PASSWORD
    // ============================================
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody EmailRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", normalizedEmail));

        var activeResetTokens = resetTokenRepository.findAllByUserUserIdAndUsedFalseOrderByCreatedAtDesc(user.getUserId());
        activeResetTokens.forEach(token -> {
            token.setUsed(true);
            token.setOtpVerified(false);
        });
        if (!activeResetTokens.isEmpty()) {
            resetTokenRepository.saveAll(activeResetTokens);
        }

        emailService.sendPasswordResetEmail(user);
        return ResponseEntity.ok(ApiResponse.success("Password reset OTP sent to your email."));
    }

    // ============================================
    // VERIFY RESET OTP
    // ============================================
    @PostMapping("/forgot-password/verify-otp")
    @Transactional
    public ResponseEntity<ApiResponse<String>> verifyResetOtp(@Valid @RequestBody ResetOtpVerifyRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", normalizedEmail));

        PasswordResetToken resetToken = resetTokenRepository
                .findTopByUserUserIdAndOtpAndUsedFalseOrderByCreatedAtDesc(user.getUserId(), request.getOtp())
                .orElseThrow(() -> new BadRequestException("Invalid OTP. Please request a new one."));

        if (resetToken.isExpired()) {
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        resetToken.setOtpVerified(true);
        resetTokenRepository.save(resetToken);

        return ResponseEntity.ok(ApiResponse.success("OTP verified successfully. You can now reset your password."));
    }

    // ============================================
    // RESET PASSWORD
    // ============================================
    @PostMapping("/reset-password")
    @Transactional
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", normalizedEmail));

        PasswordResetToken resetToken = resetTokenRepository
                .findTopByUserUserIdAndOtpVerifiedTrueAndUsedFalseOrderByCreatedAtDesc(user.getUserId())
                .orElseThrow(() -> new BadRequestException("No active password reset request found."));

        if (resetToken.isExpired()) {
            throw new BadRequestException("Reset OTP has expired. Please request a new one.");
        }

        if (resetToken.isUsed()) {
            throw new BadRequestException("Token has already been used.");
        }

        if (!resetToken.isOtpVerified()) {
            throw new BadRequestException("Please verify OTP before resetting password.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);

        var remainingTokens = resetTokenRepository.findAllByUserUserIdAndUsedFalseOrderByCreatedAtDesc(user.getUserId());
        remainingTokens.forEach(token -> token.setUsed(true));
        if (!remainingTokens.isEmpty()) {
            resetTokenRepository.saveAll(remainingTokens);
        }

        return ResponseEntity.ok(ApiResponse.success("Password reset successfully. You can now login with your new password."));
    }

    // ============================================
    // DELIVERY STATUS (EMAIL / SMS)
    // ============================================
    @GetMapping("/delivery-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDeliveryStatus(Authentication authentication) {
        String normalizedEmail = normalizeEmail(authentication.getName());
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", normalizedEmail));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("email", user.getEmail());
        data.put("phone", user.getPhone());
        data.put("emailVerified", user.isEmailVerified());
        data.put("phoneVerified", user.isPhoneVerified());

        EmailLog latestEmailLog = emailLogRepository
                .findTopByRecipientEmailOrderByCreatedAtDesc(user.getEmail())
                .orElse(null);
        if (latestEmailLog != null) {
            Map<String, Object> emailData = new LinkedHashMap<>();
            emailData.put("status", latestEmailLog.getStatus());
            emailData.put("template", latestEmailLog.getTemplateName());
            emailData.put("sentAt", latestEmailLog.getSentAt());
            emailData.put("error", latestEmailLog.getErrorMessage());
            data.put("latestEmail", emailData);
        } else {
            data.put("latestEmail", null);
        }

        SmsLog latestSmsLog = null;
        if (user.getPhone() != null && !user.getPhone().isBlank()) {
            latestSmsLog = smsLogRepository.findTopByPhoneNumberOrderByCreatedAtDesc(user.getPhone()).orElse(null);
            if (latestSmsLog == null) {
                String digits = user.getPhone().replaceAll("\\D", "");
                if (digits.length() >= 10) {
                    String lastTen = digits.substring(digits.length() - 10);
                    latestSmsLog = smsLogRepository
                            .findTopByPhoneNumberEndingWithOrderByCreatedAtDesc(lastTen)
                            .orElse(null);
                }
            }
        }
        if (latestSmsLog != null) {
            Map<String, Object> smsData = new LinkedHashMap<>();
            smsData.put("status", latestSmsLog.getStatus());
            smsData.put("purpose", latestSmsLog.getPurpose());
            smsData.put("providerSid", latestSmsLog.getProviderSid());
            smsData.put("sentAt", latestSmsLog.getSentAt());
            smsData.put("error", latestSmsLog.getErrorMessage());
            data.put("latestSms", smsData);
        } else {
            data.put("latestSms", null);
        }

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    // ============================================
    // DTO Inner Classes
    // ============================================
    @Data
    public static class OtpRequest {
        @NotBlank
        private String phone;
    }

    @Data
    public static class OtpVerifyRequest {
        @NotBlank
        private String phone;
        @NotBlank
        @Pattern(regexp = "\\d{6}", message = "OTP must be a 6-digit number")
        private String otp;
    }

    @Data
    public static class EmailRequest {
        @NotBlank @Email
        private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank
        @Email
        private String email;
        @NotBlank
        private String newPassword;
    }

    @Data
    public static class ResetOtpVerifyRequest {
        @NotBlank
        @Email
        private String email;

        @NotBlank
        @Pattern(regexp = "\\d{6}", message = "OTP must be a 6-digit number")
        private String otp;
    }

    @Data
    public static class GoogleAuthRequest {
        @NotNull
        @Valid
        private GoogleProfile profile;
    }

    @Data
    public static class GoogleProfile {
        @NotBlank
        @Email
        private String email;

        @NotBlank
        private String name;

        private String picture;
    }

    // ============================================
    // TEST EMAIL (SMTP connectivity check)
    // ============================================
    @PostMapping("/test-email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testEmail(@RequestBody EmailRequest request) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("to", request.getEmail());
        result.put("smtpHost", "smtp.gmail.com");
        result.put("smtpPort", 465);

        try {
            emailService.sendTestEmail(request.getEmail());
            result.put("status", "SENT");
            result.put("message", "Test email delivered successfully to " + request.getEmail());
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            result.put("status", "FAILED");
            result.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("SMTP error: " + e.getMessage()));
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private AuthResponse buildAuthResponse(User user, String token, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(token)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .emailVerified(user.isEmailVerified())
                .phoneVerified(user.isPhoneVerified())
                .verificationRequired(!user.isEmailVerified())
                .build();
    }
}

