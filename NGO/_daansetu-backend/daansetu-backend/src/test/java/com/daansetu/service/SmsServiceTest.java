package com.daansetu.service;

import com.daansetu.entity.OtpRecord;
import com.daansetu.entity.SmsLog;
import com.daansetu.exception.BadRequestException;
import com.daansetu.repository.OtpRepository;
import com.daansetu.repository.SmsLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SmsServiceTest {

    @Mock
    private OtpRepository otpRepository;

    @Mock
    private SmsLogRepository smsLogRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private SmsService smsService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(smsService, "otpExpiryMinutes", 10);
        ReflectionTestUtils.setField(smsService, "otpLength", 6);
        ReflectionTestUtils.setField(smsService, "maxAttempts", 3);
        ReflectionTestUtils.setField(smsService, "smsEnabled", true);
        ReflectionTestUtils.setField(smsService, "simulateSms", false);
        ReflectionTestUtils.setField(smsService, "defaultCountryCode", "91");
        ReflectionTestUtils.setField(smsService, "fast2SmsApiKey", "test-api-key");
        ReflectionTestUtils.setField(smsService, "fast2SmsUrl", "https://www.fast2sms.com/dev/bulkV2");
        ReflectionTestUtils.setField(smsService, "fast2SmsReady", true);
    }

    @Test
    void sendOtp_ShouldPersistOtpAndFast2SmsLog() {
        String phone = "9940855950";
        String normalizedPhone = "+919940855950";

        when(otpRepository.findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(normalizedPhone, OtpRecord.OtpPurpose.LOGIN))
                .thenReturn(Optional.empty());
        when(otpRepository.save(any(OtpRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(smsLogRepository.save(any(SmsLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"return\":true,\"request_id\":\"REQ-123\"}", HttpStatus.OK));

        String response = smsService.sendOtp(phone, OtpRecord.OtpPurpose.LOGIN);

        assertTrue(response.contains("OTP sent successfully"));

        ArgumentCaptor<OtpRecord> otpCaptor = ArgumentCaptor.forClass(OtpRecord.class);
        verify(otpRepository).save(otpCaptor.capture());
        OtpRecord savedOtp = otpCaptor.getValue();

        assertEquals(normalizedPhone, savedOtp.getPhone());
        assertEquals(OtpRecord.OtpPurpose.LOGIN, savedOtp.getPurpose());
        assertNotNull(savedOtp.getOtp());
        assertEquals(6, savedOtp.getOtp().length());
        assertNotNull(savedOtp.getExpiryDate());

        ArgumentCaptor<SmsLog> smsCaptor = ArgumentCaptor.forClass(SmsLog.class);
        verify(smsLogRepository).save(smsCaptor.capture());
        SmsLog savedSmsLog = smsCaptor.getValue();

        assertEquals("+919940855950", savedSmsLog.getPhoneNumber());
        assertEquals("LOGIN", savedSmsLog.getPurpose());
        assertEquals(SmsLog.SmsStatus.SENT, savedSmsLog.getStatus());
        assertNotNull(savedSmsLog.getSentAt());
        assertEquals("REQ-123", savedSmsLog.getProviderSid());
        verify(restTemplate).postForEntity(anyString(), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void sendOtp_ShouldPersistOtpAndFast2SmsLogWhenSimulationDisabled() {
        String phone = "9940855950";
        String normalizedPhone = "+919940855950";
        ReflectionTestUtils.setField(smsService, "simulateSms", false);

        when(otpRepository.findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(normalizedPhone, OtpRecord.OtpPurpose.LOGIN))
                .thenReturn(Optional.empty());
        when(otpRepository.save(any(OtpRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(smsLogRepository.save(any(SmsLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"return\":true,\"request_id\":\"REQ-123\"}", HttpStatus.OK));

        String response = smsService.sendOtp(phone, OtpRecord.OtpPurpose.LOGIN);

        assertTrue(response.contains("OTP sent successfully"));

        ArgumentCaptor<SmsLog> smsCaptor = ArgumentCaptor.forClass(SmsLog.class);
        verify(smsLogRepository).save(smsCaptor.capture());
        SmsLog savedSmsLog = smsCaptor.getValue();

        assertEquals(SmsLog.SmsStatus.SENT, savedSmsLog.getStatus());
        assertEquals("REQ-123", savedSmsLog.getProviderSid());
        assertNull(savedSmsLog.getErrorMessage());
        verify(restTemplate).postForEntity(anyString(), any(HttpEntity.class), eq(String.class));
    }

    @Test
    void sendOtp_ShouldRejectWhenFast2SmsErrors() {
        String phone = "9940855950";
        String normalizedPhone = "+919940855950";

        when(otpRepository.findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(normalizedPhone, OtpRecord.OtpPurpose.LOGIN))
                .thenReturn(Optional.empty());
        when(otpRepository.save(any(OtpRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(smsLogRepository.save(any(SmsLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("Gateway timeout"));

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> smsService.sendOtp(phone, OtpRecord.OtpPurpose.LOGIN));

        assertTrue(exception.getMessage().contains("Gateway timeout"));

        ArgumentCaptor<SmsLog> smsCaptor = ArgumentCaptor.forClass(SmsLog.class);
        verify(smsLogRepository).save(smsCaptor.capture());
        SmsLog savedSmsLog = smsCaptor.getValue();

        assertEquals(SmsLog.SmsStatus.FAILED, savedSmsLog.getStatus());
        assertNotNull(savedSmsLog.getErrorMessage());
        assertTrue(savedSmsLog.getErrorMessage().contains("Gateway timeout"));
    }

    @Test
    void sendOtp_ShouldRejectDuringCooldown() {
        String phone = "9940855950";
        String normalizedPhone = "+919940855950";
        OtpRecord recentOtp = OtpRecord.builder()
                .phone(normalizedPhone)
                .purpose(OtpRecord.OtpPurpose.LOGIN)
                .otp("111111")
                .verified(false)
                .createdAt(LocalDateTime.now().minusSeconds(30))
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .build();

        when(otpRepository.findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(normalizedPhone, OtpRecord.OtpPurpose.LOGIN))
                .thenReturn(Optional.of(recentOtp));

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> smsService.sendOtp(phone, OtpRecord.OtpPurpose.LOGIN));

        assertTrue(exception.getMessage().contains("Please wait before requesting another OTP"));
        verify(otpRepository, never()).save(any(OtpRecord.class));
        verify(smsLogRepository, never()).save(any(SmsLog.class));
    }

    @Test
    void verifyOtp_ShouldMarkVerifiedWhenOtpMatches() {
        String phone = "9940855950";
        String normalizedPhone = "+919940855950";
        OtpRecord otpRecord = OtpRecord.builder()
                .phone(normalizedPhone)
                .purpose(OtpRecord.OtpPurpose.LOGIN)
                .otp("123456")
                .attempts(0)
                .verified(false)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .build();

        when(otpRepository.findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(normalizedPhone, OtpRecord.OtpPurpose.LOGIN))
                .thenReturn(Optional.of(otpRecord));
        when(otpRepository.save(any(OtpRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        boolean result = smsService.verifyOtp(phone, "123456", OtpRecord.OtpPurpose.LOGIN);

        assertTrue(result);
        assertEquals(1, otpRecord.getAttempts());
        assertTrue(otpRecord.isVerified());
        verify(otpRepository, times(1)).save(otpRecord);
    }

    @Test
    void verifyOtp_ShouldIncrementAttemptsAndThrowForWrongOtp() {
        String phone = "9940855950";
        String normalizedPhone = "+919940855950";
        OtpRecord otpRecord = OtpRecord.builder()
                .phone(normalizedPhone)
                .purpose(OtpRecord.OtpPurpose.LOGIN)
                .otp("123456")
                .attempts(0)
                .verified(false)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .build();

        when(otpRepository.findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(normalizedPhone, OtpRecord.OtpPurpose.LOGIN))
                .thenReturn(Optional.of(otpRecord));
        when(otpRepository.save(any(OtpRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> smsService.verifyOtp(phone, "000000", OtpRecord.OtpPurpose.LOGIN));

        assertTrue(exception.getMessage().contains("Invalid OTP"));
        assertEquals(1, otpRecord.getAttempts());
        assertFalse(otpRecord.isVerified());
        verify(otpRepository, times(1)).save(otpRecord);
    }

    @Test
    void verifyOtp_ShouldRejectWhenMaxAttemptsReached() {
        String phone = "9940855950";
        String normalizedPhone = "+919940855950";
        OtpRecord otpRecord = OtpRecord.builder()
                .phone(normalizedPhone)
                .purpose(OtpRecord.OtpPurpose.LOGIN)
                .otp("123456")
                .attempts(3)
                .verified(false)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .build();

        when(otpRepository.findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(normalizedPhone, OtpRecord.OtpPurpose.LOGIN))
                .thenReturn(Optional.of(otpRecord));

        BadRequestException exception = assertThrows(BadRequestException.class,
                () -> smsService.verifyOtp(phone, "123456", OtpRecord.OtpPurpose.LOGIN));

        assertTrue(exception.getMessage().contains("Maximum OTP attempts exceeded"));
        verify(otpRepository, never()).save(any(OtpRecord.class));
    }
}

