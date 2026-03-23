package com.daansetu.service;

import com.daansetu.entity.*;
import com.daansetu.enums.DonationType;
import com.daansetu.enums.PickupStatus;
import com.daansetu.enums.UserRole;
import com.daansetu.repository.EmailLogRepository;
import com.daansetu.repository.EmailVerificationTokenRepository;
import com.daansetu.repository.OtpRepository;
import com.daansetu.repository.PasswordResetTokenRepository;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EmailService Tests")
class EmailServiceTest {

    // ─── Mocks ──────────────────────────────────────────────────────────────────

    @Mock private JavaMailSender mailSender;
    @Mock private EmailLogRepository emailLogRepository;
    @Mock private EmailVerificationTokenRepository verificationTokenRepository;
    @Mock private PasswordResetTokenRepository resetTokenRepository;
    @Mock private OtpRepository otpRepository;
    @Mock private MimeMessage mimeMessage;

    @InjectMocks
    private EmailService emailService;

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private User buildUser() {
        return User.builder()
                .userId(1L)
                .name("Test User")
                .email("test@daansetu.org")
                .role(UserRole.DONOR)
                .password("hashed")
                .build();
    }

    private Donation buildDonation(User user) {
        NGO ngo = NGO.builder().ngoId(1L).ngoName("Hope Foundation").build();

        Campaign campaign = Campaign.builder()
                .campaignId(1L)
                .title("Feed the Poor")
                .ngo(ngo)
                .build();

        return Donation.builder()
                .donationId(1L)
                .user(user)
                .campaign(campaign)
                .amount(BigDecimal.valueOf(500.00))
                .donationDate(LocalDateTime.now())
                .build();
    }

    private DonationReceipt buildReceipt(Donation donation) {
        return DonationReceipt.builder()
                .receiptId(1L)
                .donation(donation)
                .receiptNumber("RCPT-2024-0001")
                .issuedDate(LocalDateTime.now())
                .build();
    }

    private PickupRequest buildPickupRequest(User donor, String ngoEmail) {
        NGO ngo = NGO.builder()
                .ngoId(10L)
                .ngoName("Hope Foundation")
                .email(ngoEmail)
                .build();

        Campaign campaign = Campaign.builder()
                .campaignId(11L)
                .title("Food Drive")
                .ngo(ngo)
                .build();

        Donation donation = Donation.builder()
                .donationId(12L)
                .user(donor)
                .campaign(campaign)
                .donationType(DonationType.FOOD)
                .build();

        return PickupRequest.builder()
                .pickupId(13L)
                .donation(donation)
                .donorAddress("12 Gandhi Street, Chennai")
                .pickupDate(LocalDateTime.now().toLocalDate().plusDays(1))
                .timeSlot("10:00 AM - 12:00 PM")
                .contactPhone("9999999999")
                .pickupStatus(PickupStatus.PENDING)
                .build();
    }

    private Volunteer buildVolunteer(String name, String email, String phone) {
        User volunteerUser = User.builder()
                .userId(20L)
                .name(name)
                .email(email)
                .phone(phone)
                .role(UserRole.VOLUNTEER)
                .password("hashed")
                .build();

        return Volunteer.builder()
                .volunteerId(21L)
                .user(volunteerUser)
                .build();
    }

    // ─── Setup ──────────────────────────────────────────────────────────────────

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "DaanSetu <noreply@daansetu.local>");
        ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(emailService, "verificationExpiryHours", 24);
        ReflectionTestUtils.setField(emailService, "emailEnabled", true);
    }

    // ─── sendVerificationEmail ───────────────────────────────────────────────────

    @Nested
    @DisplayName("sendVerificationEmail()")
    class SendVerificationEmail {

        @Test
        @DisplayName("should save token, send email and log SENT status")
        void shouldSaveTokenAndSendEmail() {
            User user = buildUser();
            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
            when(emailLogRepository.save(any(EmailLog.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            emailService.sendVerificationEmail(user);

            // token persisted
            ArgumentCaptor<EmailVerificationToken> tokenCaptor =
                    ArgumentCaptor.forClass(EmailVerificationToken.class);
            verify(verificationTokenRepository).save(tokenCaptor.capture());
            EmailVerificationToken savedToken = tokenCaptor.getValue();
            assertNotNull(savedToken.getToken());
            assertEquals(user, savedToken.getUser());
            assertTrue(savedToken.getExpiryDate().isAfter(LocalDateTime.now()));

            // mail sent
            verify(mailSender).send(any(MimeMessage.class));

            // email log has SENT status
            ArgumentCaptor<EmailLog> logCaptor = ArgumentCaptor.forClass(EmailLog.class);
            verify(emailLogRepository).save(logCaptor.capture());
            EmailLog log = logCaptor.getValue();
            assertEquals(EmailLog.EmailStatus.SENT, log.getStatus());
            assertEquals(user.getEmail(), log.getRecipientEmail());
            assertEquals("verification", log.getTemplateName());
        }

        @Test
        @DisplayName("should log FAILED when mail sender throws exception")
        void shouldLogFailedOnMailException() {
            User user = buildUser();
            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
            doThrow(new MailSendException("SMTP error")).when(mailSender).send(any(MimeMessage.class));
            when(emailLogRepository.save(any(EmailLog.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // async method — call directly; should not throw
            assertDoesNotThrow(() -> emailService.sendVerificationEmail(user));

            ArgumentCaptor<EmailLog> logCaptor = ArgumentCaptor.forClass(EmailLog.class);
            verify(emailLogRepository).save(logCaptor.capture());
            EmailLog log = logCaptor.getValue();
            assertEquals(EmailLog.EmailStatus.FAILED, log.getStatus());
            assertNotNull(log.getErrorMessage());
        }

        @Test
        @DisplayName("should skip sending and log FAILED when email is disabled")
        void shouldSkipWhenEmailDisabled() {
            ReflectionTestUtils.setField(emailService, "emailEnabled", false);
            User user = buildUser();

            emailService.sendVerificationEmail(user);

            // no token when disabled (token saved before the guard in sendHtmlEmail, but token IS saved first)
            verify(verificationTokenRepository).save(any(EmailVerificationToken.class));

            // mail should NOT be sent
            verify(mailSender, never()).send(any(MimeMessage.class));

            ArgumentCaptor<EmailLog> logCaptor = ArgumentCaptor.forClass(EmailLog.class);
            verify(emailLogRepository).save(logCaptor.capture());
            assertEquals(EmailLog.EmailStatus.FAILED, logCaptor.getValue().getStatus());
        }
    }

    // ─── sendPasswordResetEmail ──────────────────────────────────────────────────

    @Nested
    @DisplayName("sendPasswordResetEmail()")
    class SendPasswordResetEmail {

        @Test
        @DisplayName("should save reset token with OTP and send email")
        void shouldSaveResetTokenAndSendEmail() {
            User user = buildUser();
            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
            when(emailLogRepository.save(any(EmailLog.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            emailService.sendPasswordResetEmail(user);

            // reset token saved with OTP
            ArgumentCaptor<PasswordResetToken> tokenCaptor =
                    ArgumentCaptor.forClass(PasswordResetToken.class);
            verify(resetTokenRepository).save(tokenCaptor.capture());
            PasswordResetToken savedToken = tokenCaptor.getValue();
            assertNotNull(savedToken.getOtp());
            assertEquals(6, savedToken.getOtp().length());
            assertNotNull(savedToken.getToken());
            assertEquals(user, savedToken.getUser());
            assertTrue(savedToken.getExpiryDate().isAfter(LocalDateTime.now()));

            // email sent
            verify(mailSender).send(any(MimeMessage.class));

            ArgumentCaptor<EmailLog> logCaptor = ArgumentCaptor.forClass(EmailLog.class);
            verify(emailLogRepository).save(logCaptor.capture());
            assertEquals(EmailLog.EmailStatus.SENT, logCaptor.getValue().getStatus());
            assertEquals("password_reset", logCaptor.getValue().getTemplateName());
        }

        @Test
        @DisplayName("should log FAILED when SMTP throws")
        void shouldLogFailedOnSmtpError() {
            User user = buildUser();
            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
            doThrow(new MailSendException("Connection refused")).when(mailSender).send(any(MimeMessage.class));
            when(emailLogRepository.save(any(EmailLog.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> emailService.sendPasswordResetEmail(user));

            ArgumentCaptor<EmailLog> logCaptor = ArgumentCaptor.forClass(EmailLog.class);
            verify(emailLogRepository).save(logCaptor.capture());
            assertEquals(EmailLog.EmailStatus.FAILED, logCaptor.getValue().getStatus());
        }
    }

    // ─── sendDonationReceiptEmail ────────────────────────────────────────────────

    @Nested
    @DisplayName("sendDonationReceiptEmail()")
    class SendDonationReceiptEmail {

        @Test
        @DisplayName("should send receipt email and log SENT")
        void shouldSendReceiptEmail() {
            User user = buildUser();
            Donation donation = buildDonation(user);
            DonationReceipt receipt = buildReceipt(donation);

            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
            when(emailLogRepository.save(any(EmailLog.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            emailService.sendDonationReceiptEmail(user, donation, receipt);

            verify(mailSender).send(any(MimeMessage.class));

            ArgumentCaptor<EmailLog> logCaptor = ArgumentCaptor.forClass(EmailLog.class);
            verify(emailLogRepository).save(logCaptor.capture());
            EmailLog log = logCaptor.getValue();
            assertEquals(EmailLog.EmailStatus.SENT, log.getStatus());
            assertEquals("donation_receipt", log.getTemplateName());
            assertEquals(user.getEmail(), log.getRecipientEmail());
            assertTrue(log.getSubject().contains(receipt.getReceiptNumber()));
        }

        @Test
        @DisplayName("should log FAILED when mail sender throws")
        void shouldLogFailedOnError() {
            User user = buildUser();
            Donation donation = buildDonation(user);
            DonationReceipt receipt = buildReceipt(donation);

            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
            doThrow(new MailSendException("SMTP error")).when(mailSender).send(any(MimeMessage.class));
            when(emailLogRepository.save(any(EmailLog.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> emailService.sendDonationReceiptEmail(user, donation, receipt));

            ArgumentCaptor<EmailLog> logCaptor = ArgumentCaptor.forClass(EmailLog.class);
            verify(emailLogRepository).save(logCaptor.capture());
            assertEquals(EmailLog.EmailStatus.FAILED, logCaptor.getValue().getStatus());
        }
    }

    // ─── sendThankYouEmail ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("sendThankYouEmail()")
    class SendThankYouEmail {

        @Test
        @DisplayName("should send thank-you email and log SENT")
        void shouldSendThankYouEmail() {
            User user = buildUser();
            Donation donation = buildDonation(user);

            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
            when(emailLogRepository.save(any(EmailLog.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            emailService.sendThankYouEmail(user, donation);

            verify(mailSender).send(any(MimeMessage.class));

            ArgumentCaptor<EmailLog> logCaptor = ArgumentCaptor.forClass(EmailLog.class);
            verify(emailLogRepository).save(logCaptor.capture());
            EmailLog log = logCaptor.getValue();
            assertEquals(EmailLog.EmailStatus.SENT, log.getStatus());
            assertEquals("thank_you", log.getTemplateName());
            assertEquals(user.getEmail(), log.getRecipientEmail());
        }

        @Test
        @DisplayName("should log FAILED when SMTP is unavailable")
        void shouldLogFailedWhenSmtpUnavailable() {
            User user = buildUser();
            Donation donation = buildDonation(user);

            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
            doThrow(new MailSendException("Timeout")).when(mailSender).send(any(MimeMessage.class));
            when(emailLogRepository.save(any(EmailLog.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> emailService.sendThankYouEmail(user, donation));

            ArgumentCaptor<EmailLog> logCaptor = ArgumentCaptor.forClass(EmailLog.class);
            verify(emailLogRepository).save(logCaptor.capture());
            assertEquals(EmailLog.EmailStatus.FAILED, logCaptor.getValue().getStatus());
        }

        @Test
        @DisplayName("should skip sending when email is globally disabled")
        void shouldSkipWhenDisabled() {
            ReflectionTestUtils.setField(emailService, "emailEnabled", false);
            User user = buildUser();
            Donation donation = buildDonation(user);

            emailService.sendThankYouEmail(user, donation);

            verify(mailSender, never()).send(any(MimeMessage.class));

            ArgumentCaptor<EmailLog> logCaptor = ArgumentCaptor.forClass(EmailLog.class);
            verify(emailLogRepository).save(logCaptor.capture());
            assertEquals(EmailLog.EmailStatus.FAILED, logCaptor.getValue().getStatus());
        }
    }

    @Nested
    @DisplayName("Pickup Workflow Emails")
    class PickupWorkflowEmails {

        @Test
        @DisplayName("should send NGO/Admin approval email for new pickup request")
        void shouldSendPickupApprovalEmail() {
            User donor = buildUser();
            PickupRequest pickup = buildPickupRequest(donor, "ngo@daansetu.org");

            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
            when(emailLogRepository.save(any(EmailLog.class))).thenAnswer(inv -> inv.getArgument(0));

            emailService.sendPickupApprovalRequestEmail(pickup);

            verify(mailSender, times(1)).send(any(MimeMessage.class));

            ArgumentCaptor<EmailLog> logCaptor = ArgumentCaptor.forClass(EmailLog.class);
            verify(emailLogRepository).save(logCaptor.capture());
            assertEquals("pickup_admin_approval", logCaptor.getValue().getTemplateName());
            assertEquals("ngo@daansetu.org", logCaptor.getValue().getRecipientEmail());
            assertEquals(EmailLog.EmailStatus.SENT, logCaptor.getValue().getStatus());
        }

        @Test
        @DisplayName("should send donor assignment email after volunteer assignment")
        void shouldSendDonorAssignmentEmail() {
            User donor = buildUser();
            PickupRequest pickup = buildPickupRequest(donor, "ngo@daansetu.org");
            Volunteer volunteer = buildVolunteer("Volunteer A", "volunteer@daansetu.org", "9876543210");

            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
            when(emailLogRepository.save(any(EmailLog.class))).thenAnswer(inv -> inv.getArgument(0));

            emailService.sendDonorPickupAssignedEmail(pickup, volunteer);

            verify(mailSender, times(1)).send(any(MimeMessage.class));

            ArgumentCaptor<EmailLog> logCaptor = ArgumentCaptor.forClass(EmailLog.class);
            verify(emailLogRepository).save(logCaptor.capture());
            assertEquals("pickup_donor_assigned", logCaptor.getValue().getTemplateName());
            assertEquals(donor.getEmail(), logCaptor.getValue().getRecipientEmail());
            assertEquals(EmailLog.EmailStatus.SENT, logCaptor.getValue().getStatus());
        }

        @Test
        @DisplayName("should send donor approval email after NGO approves pickup")
        void shouldSendDonorApprovedEmail() {
            User donor = buildUser();
            PickupRequest pickup = buildPickupRequest(donor, "ngo@daansetu.org");

            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
            when(emailLogRepository.save(any(EmailLog.class))).thenAnswer(inv -> inv.getArgument(0));

            emailService.sendDonorPickupApprovedEmail(pickup);

            verify(mailSender, times(1)).send(any(MimeMessage.class));

            ArgumentCaptor<EmailLog> logCaptor = ArgumentCaptor.forClass(EmailLog.class);
            verify(emailLogRepository).save(logCaptor.capture());
            assertEquals("pickup_donor_approved", logCaptor.getValue().getTemplateName());
            assertEquals(donor.getEmail(), logCaptor.getValue().getRecipientEmail());
            assertEquals(EmailLog.EmailStatus.SENT, logCaptor.getValue().getStatus());
        }

        @Test
        @DisplayName("should send in-progress email to donor when volunteer starts pickup")
        void shouldSendDonorInProgressEmail() {
            User donor = buildUser();
            PickupRequest pickup = buildPickupRequest(donor, "ngo@daansetu.org");
            Volunteer volunteer = buildVolunteer("Volunteer A", "volunteer@daansetu.org", "9876543210");

            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
            when(emailLogRepository.save(any(EmailLog.class))).thenAnswer(inv -> inv.getArgument(0));

            emailService.sendDonorPickupInProgressEmail(pickup, volunteer);

            verify(mailSender, times(1)).send(any(MimeMessage.class));

            ArgumentCaptor<EmailLog> logCaptor = ArgumentCaptor.forClass(EmailLog.class);
            verify(emailLogRepository).save(logCaptor.capture());
            assertEquals("pickup_in_progress", logCaptor.getValue().getTemplateName());
            assertEquals(donor.getEmail(), logCaptor.getValue().getRecipientEmail());
            assertEquals(EmailLog.EmailStatus.SENT, logCaptor.getValue().getStatus());
        }

        @Test
        @DisplayName("should send pickup completion email to donor, volunteer, and NGO")
        void shouldSendCompletionEmailToAllStakeholders() {
            User donor = buildUser();
            PickupRequest pickup = buildPickupRequest(donor, "ngo@daansetu.org");
            Volunteer volunteer = buildVolunteer("Volunteer A", "volunteer@daansetu.org", "9876543210");

            when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
            when(emailLogRepository.save(any(EmailLog.class))).thenAnswer(inv -> inv.getArgument(0));

            emailService.sendPickupCompletedEmailToStakeholders(pickup, volunteer);

            verify(mailSender, times(3)).send(any(MimeMessage.class));
            verify(emailLogRepository, times(3)).save(any(EmailLog.class));
        }
    }
}


