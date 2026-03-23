package com.daansetu.controller;

import com.daansetu.dto.response.ApiResponse;
import com.daansetu.entity.PasswordResetToken;
import com.daansetu.entity.User;
import com.daansetu.enums.UserRole;
import com.daansetu.repository.EmailLogRepository;
import com.daansetu.repository.EmailVerificationTokenRepository;
import com.daansetu.repository.OtpRepository;
import com.daansetu.repository.PasswordResetTokenRepository;
import com.daansetu.repository.SmsLogRepository;
import com.daansetu.repository.UserRepository;
import com.daansetu.security.JwtTokenProvider;
import com.daansetu.service.EmailService;
import com.daansetu.service.SmsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerForgotPasswordUnitTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailService emailService;
    @Mock private SmsService smsService;
    @Mock private PasswordResetTokenRepository resetTokenRepository;

    private AuthController authController;

    private User user;

    @BeforeEach
    void setUp() {
        authController = new AuthController(
                userRepository,
                passwordEncoder,
                mock(org.springframework.security.authentication.AuthenticationManager.class),
                mock(JwtTokenProvider.class),
                emailService,
                smsService,
                mock(EmailVerificationTokenRepository.class),
                resetTokenRepository,
                mock(OtpRepository.class),
                mock(EmailLogRepository.class),
                mock(SmsLogRepository.class)
        );

        user = User.builder()
                .userId(10L)
                .name("Reset User")
                .email("reset@example.com")
                .password("encoded-password")
                .phone("9876543210")
                .role(UserRole.DONOR)
                .build();
    }

    @Test
    void forgotPassword_ShouldInvalidateOldTokensAndSendEmailOtp() {
        PasswordResetToken oldToken = PasswordResetToken.builder()
                .id(1L)
                .user(user)
                .token("old-token")
                .otp("111111")
                .used(false)
                .otpVerified(true)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .build();

        AuthController.EmailRequest request = new AuthController.EmailRequest();
        request.setEmail(user.getEmail());

        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(resetTokenRepository.findAllByUserUserIdAndUsedFalseOrderByCreatedAtDesc(user.getUserId()))
                .thenReturn(List.of(oldToken));

        ResponseEntity<ApiResponse<String>> response = authController.forgotPassword(request);

        assertEquals(200, response.getStatusCode().value());
        ApiResponse<String> body = Objects.requireNonNull(response.getBody());
        assertEquals("Password reset OTP sent to your email.", body.getData());
        assertTrue(oldToken.isUsed());
        assertFalse(oldToken.isOtpVerified());
        verify(resetTokenRepository).saveAll(List.of(oldToken));
        verify(emailService).sendPasswordResetEmail(user);
        verifyNoInteractions(smsService);
    }

    @Test
    void verifyResetOtp_ShouldMarkTokenVerified() {
        PasswordResetToken token = PasswordResetToken.builder()
                .id(2L)
                .user(user)
                .token("reset-token")
                .otp("654321")
                .used(false)
                .otpVerified(false)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .build();

        AuthController.ResetOtpVerifyRequest request = new AuthController.ResetOtpVerifyRequest();
        request.setEmail(user.getEmail());
        request.setOtp("654321");

        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(resetTokenRepository.findTopByUserUserIdAndOtpAndUsedFalseOrderByCreatedAtDesc(user.getUserId(), "654321"))
                .thenReturn(Optional.of(token));
        when(resetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<ApiResponse<String>> response = authController.verifyResetOtp(request);

        assertEquals(200, response.getStatusCode().value());
        ApiResponse<String> body = Objects.requireNonNull(response.getBody());
        assertEquals("OTP verified successfully. You can now reset your password.", body.getData());
        assertTrue(token.isOtpVerified());
        verify(resetTokenRepository).save(token);
    }

    @Test
    void resetPassword_ShouldUseVerifiedTokenAndInvalidateRemainingActiveTokens() {
        PasswordResetToken verifiedToken = PasswordResetToken.builder()
                .id(3L)
                .user(user)
                .token("verified-token")
                .otp("123456")
                .used(false)
                .otpVerified(true)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .build();

        PasswordResetToken newerUnverifiedToken = PasswordResetToken.builder()
                .id(4L)
                .user(user)
                .token("newer-token")
                .otp("999999")
                .used(false)
                .otpVerified(false)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .build();

        AuthController.ResetPasswordRequest request = new AuthController.ResetPasswordRequest();
        request.setEmail(user.getEmail());
        request.setNewPassword("NewPassword@123");

        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(resetTokenRepository.findTopByUserUserIdAndOtpVerifiedTrueAndUsedFalseOrderByCreatedAtDesc(user.getUserId()))
                .thenReturn(Optional.of(verifiedToken));
        when(resetTokenRepository.findAllByUserUserIdAndUsedFalseOrderByCreatedAtDesc(user.getUserId()))
                .thenReturn(List.of(newerUnverifiedToken));
        when(passwordEncoder.encode("NewPassword@123")).thenReturn("encoded-new-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(resetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<ApiResponse<String>> response = authController.resetPassword(request);

        assertEquals(200, response.getStatusCode().value());
        Objects.requireNonNull(response.getBody());
        assertEquals("encoded-new-password", user.getPassword());
        assertTrue(verifiedToken.isUsed());
        assertTrue(newerUnverifiedToken.isUsed());
        verify(resetTokenRepository).save(verifiedToken);
        verify(resetTokenRepository).saveAll(List.of(newerUnverifiedToken));
    }
}

