// src/main/java/com/daansetu/service/EmailService.java
package com.daansetu.service;

import com.daansetu.entity.*;
import com.daansetu.repository.*;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import com.daansetu.enums.UserRole;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private static final OtpRecord.OtpPurpose EMAIL_VERIFICATION_OTP_PURPOSE = OtpRecord.OtpPurpose.VERIFY_EMAIL;
    private static final OtpRecord.OtpPurpose PICKUP_OTP_PURPOSE = OtpRecord.OtpPurpose.PICKUP_REMINDER;

    private final JavaMailSender mailSender;
    private final EmailLogRepository emailLogRepository;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final OtpRepository otpRepository;
    private final UserRepository userRepository;
    private final DonationItemRepository donationItemRepository;

    @Value("${app.email.from:DaanSetu <noreply@daansetu.local>}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.email.verification-expiry:24}")
    private int verificationExpiryHours;

    @Value("${app.otp.expiry-minutes:10}")
    private int verificationOtpExpiryMinutes;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    // ============================================
    // EMAIL VERIFICATION
    // ============================================
    @Async
    public void sendVerificationEmail(User user) {
        var activeTokens = verificationTokenRepository
                .findAllByUserUserIdAndUsedFalseOrderByCreatedAtDesc(user.getUserId());
        activeTokens.forEach(token -> token.setUsed(true));
        if (!activeTokens.isEmpty()) {
            verificationTokenRepository.saveAll(activeTokens);
        }

        String token = UUID.randomUUID().toString();

        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .user(user)
                .token(token)
                .expiryDate(LocalDateTime.now().plusHours(verificationExpiryHours))
                .build();
        verificationTokenRepository.save(verificationToken);

        String verifyUrl = frontendUrl + "/verify-email?token=" + token;
        String subject = "🔐 Verify Your DaanSetu Account";

        String html = """
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:40px 30px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:28px;">❤️ DaanSetu</h1>
                    <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">Transparent Donation Platform</p>
                </div>
                <div style="padding:30px;">
                    <h2 style="color:#e2e8f0;margin:0 0 15px;">Welcome, %s! 👋</h2>
                    <p style="color:#94a3b8;font-size:15px;line-height:1.6;">
                        Thank you for joining DaanSetu. Please verify your email address to access all features
                        and start making a difference.
                    </p>
                    <div style="text-align:center;margin:30px 0;">
                        <a href="%s" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;text-decoration:none;padding:14px 40px;border-radius:12px;font-weight:600;font-size:16px;">
                            ✅ Verify Email Address
                        </a>
                    </div>
                    <p style="color:#64748b;font-size:13px;">
                        This link expires in %d hours. If you didn't create an account, please ignore this email.
                    </p>
                    <hr style="border:none;border-top:1px solid #1e293b;margin:25px 0;">
                    <p style="color:#475569;font-size:12px;text-align:center;">
                        © 2024 DaanSetu Foundation | Mumbai, India<br>
                        <a href="%s" style="color:#3b82f6;">Visit Website</a>
                    </p>
                </div>
            </div>
            """.formatted(user.getName(), verifyUrl, verificationExpiryHours, frontendUrl);

        sendHtmlEmail(user.getEmail(), subject, html, "verification");
    }

    @Async
    public void sendVerificationOtpEmail(User user) {
        otpRepository.deleteByEmailAndPurpose(user.getEmail(), EMAIL_VERIFICATION_OTP_PURPOSE);

        String otp = generateOtp();
        String otpPhone = resolveOtpPhone(user);
        OtpRecord otpRecord = OtpRecord.builder()
                .phone(otpPhone)
                .email(user.getEmail())
                .otp(otp)
                .purpose(EMAIL_VERIFICATION_OTP_PURPOSE)
                .expiryDate(LocalDateTime.now().plusMinutes(verificationOtpExpiryMinutes))
                .build();
        otpRepository.save(otpRecord);

        String subject = "🔐 Your DaanSetu Email Verification OTP";
        String html = """
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:40px 30px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:28px;">🔐 Verify Your Email</h1>
                </div>
                <div style="padding:30px;">
                    <h2 style="color:#e2e8f0;margin:0 0 15px;">Hi %s,</h2>
                    <p style="color:#94a3b8;font-size:15px;line-height:1.6;">
                        Use this OTP to verify your DaanSetu account.
                    </p>
                    <div style="text-align:center;margin:25px 0;padding:20px;background:#1e293b;border-radius:12px;border:1px solid #334155;">
                        <p style="color:#94a3b8;margin:0 0 8px;font-size:13px;">Your Email OTP</p>
                        <h1 style="color:#3b82f6;margin:0;font-size:36px;letter-spacing:8px;font-family:monospace;">%s</h1>
                        <p style="color:#64748b;margin:8px 0 0;font-size:12px;">Valid for %d minutes</p>
                    </div>
                    <p style="color:#64748b;font-size:13px;">
                        If you did not create this account, please ignore this email.
                    </p>
                </div>
            </div>
            """.formatted(user.getName(), otp, verificationOtpExpiryMinutes);

        sendHtmlEmail(user.getEmail(), subject, html, "verification_otp");
    }

    // ============================================
    // PASSWORD RESET
    // ============================================
    @Async
    public void sendPasswordResetEmail(User user) {
        String token = UUID.randomUUID().toString();
        String otp = generateOtp();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(token)
                .otp(otp)
                .expiryDate(LocalDateTime.now().plusMinutes(30))
                .build();
        resetTokenRepository.save(resetToken);

        String subject = "🔑 Your DaanSetu Password Reset OTP";

        String html = """
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:40px 30px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:28px;">🔑 Password Reset</h1>
                </div>
                <div style="padding:30px;">
                    <h2 style="color:#e2e8f0;margin:0 0 15px;">Hi %s,</h2>
                    <p style="color:#94a3b8;font-size:15px;line-height:1.6;">
                        We received a request to reset your password. Verify this OTP first, then set a new password.
                    </p>
                    <div style="text-align:center;margin:25px 0;padding:20px;background:#1e293b;border-radius:12px;border:1px solid #334155;">
                        <p style="color:#94a3b8;margin:0 0 8px;font-size:13px;">Your OTP Code</p>
                        <h1 style="color:#3b82f6;margin:0;font-size:36px;letter-spacing:8px;font-family:monospace;">%s</h1>
                        <p style="color:#64748b;margin:8px 0 0;font-size:12px;">Valid for 30 minutes</p>
                    </div>
                    <p style="color:#64748b;font-size:13px;margin:8px 0 0;">
                        OTP validity: 30 minutes. Do not share this code with anyone.
                    </p>
                    <p style="color:#64748b;font-size:13px;">
                        If you didn't request this reset, please ignore this email. Your password will remain unchanged.
                    </p>
                </div>
            </div>
            """.formatted(user.getName(), otp);

        sendHtmlEmail(user.getEmail(), subject, html, "password_reset");
    }

    // ============================================
    // DONATION RECEIPT EMAIL
    // ============================================
    @Async
    public void sendDonationReceiptEmail(User user, Donation donation, DonationReceipt receipt) {
        String subject = "🧾 Donation Receipt - " + receipt.getReceiptNumber();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMMM yyyy, hh:mm a");

        String html = """
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#16a34a,#22c55e);padding:40px 30px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:28px;">✅ Donation Receipt</h1>
                    <p style="color:#bbf7d0;margin:8px 0 0;font-size:14px;">Tax Deductible under 80G</p>
                </div>
                <div style="padding:30px;">
                    <h2 style="color:#e2e8f0;margin:0 0 5px;">Thank you, %s! 🙏</h2>
                    <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;">Your generous donation has been confirmed.</p>

                    <div style="background:#1e293b;border-radius:12px;padding:20px;border:1px solid #334155;margin:20px 0;">
                        <table style="width:100%%;border-collapse:collapse;">
                            <tr><td style="color:#94a3b8;padding:8px 0;font-size:13px;">Receipt No.</td><td style="color:#3b82f6;text-align:right;font-family:monospace;font-size:13px;">%s</td></tr>
                            <tr><td style="color:#94a3b8;padding:8px 0;font-size:13px;">Amount</td><td style="color:#22c55e;text-align:right;font-weight:700;font-size:18px;">₹%s</td></tr>
                            <tr><td style="color:#94a3b8;padding:8px 0;font-size:13px;">Campaign</td><td style="color:#e2e8f0;text-align:right;font-size:13px;">%s</td></tr>
                            <tr><td style="color:#94a3b8;padding:8px 0;font-size:13px;">NGO</td><td style="color:#e2e8f0;text-align:right;font-size:13px;">%s</td></tr>
                            <tr><td style="color:#94a3b8;padding:8px 0;font-size:13px;">Date</td><td style="color:#e2e8f0;text-align:right;font-size:13px;">%s</td></tr>
                            <tr><td style="color:#94a3b8;padding:8px 0;font-size:13px;">Status</td><td style="text-align:right;"><span style="background:#16a34a22;color:#22c55e;padding:4px 12px;border-radius:20px;font-size:12px;">Completed</span></td></tr>
                        </table>
                    </div>

                    <div style="background:#16a34a11;border:1px solid #16a34a33;border-radius:10px;padding:15px;margin:15px 0;">
                        <p style="color:#22c55e;margin:0;font-size:13px;">✓ This donation is eligible for tax deduction under Section 80G of the Income Tax Act, 1961.</p>
                    </div>

                    <div style="text-align:center;margin:25px 0;">
                        <a href="%s/receipt/%s" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;text-decoration:none;padding:12px 35px;border-radius:12px;font-weight:600;">
                            📄 View Full Receipt
                        </a>
                    </div>
                </div>
            </div>
            """.formatted(
                user.getName(),
                receipt.getReceiptNumber(),
                String.format("%,.2f", donation.getAmount()),
                donation.getCampaign().getTitle(),
                donation.getCampaign().getNgo().getNgoName(),
                donation.getDonationDate().format(formatter),
                frontendUrl,
                receipt.getReceiptNumber()
        );

        sendHtmlEmail(user.getEmail(), subject, html, "donation_receipt");
    }

    // ============================================
    // THANK YOU SUMMARY
    // ============================================
    @Async
    public void sendThankYouEmail(User user, Donation donation) {
        String subject = "💖 Thank You for Making a Difference!";

        String html = """
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:40px 30px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:32px;">💖 Thank You!</h1>
                    <p style="color:#e9d5ff;margin:10px 0 0;font-size:16px;">You're making the world better</p>
                </div>
                <div style="padding:30px;">
                    <h2 style="color:#e2e8f0;margin:0 0 15px;">Dear %s,</h2>
                    <p style="color:#94a3b8;font-size:15px;line-height:1.7;">
                        Your donation of <strong style="color:#22c55e;">₹%s</strong> to
                        <strong style="color:#3b82f6;">"%s"</strong> is creating real impact.
                    </p>

                    <div style="background:#1e293b;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
                        <h3 style="color:#e2e8f0;margin:0 0 15px;">🌟 Your Impact So Far</h3>
                        <table style="width:100%%;text-align:center;">
                            <tr>
                                <td style="padding:10px;"><span style="font-size:24px;color:#3b82f6;font-weight:700;">5</span><br><span style="color:#94a3b8;font-size:12px;">Campaigns</span></td>
                                <td style="padding:10px;"><span style="font-size:24px;color:#22c55e;font-weight:700;">₹%s</span><br><span style="color:#94a3b8;font-size:12px;">Total Donated</span></td>
                                <td style="padding:10px;"><span style="font-size:24px;color:#f97316;font-weight:700;">15</span><br><span style="color:#94a3b8;font-size:12px;">Lives Impacted</span></td>
                            </tr>
                        </table>
                    </div>

                    <p style="color:#94a3b8;font-size:14px;line-height:1.6;">
                        Every rupee you contribute helps build schools, feed the hungry, and bring healthcare to remote villages.
                        Together, we're building a bridge of hope.
                    </p>

                    <div style="text-align:center;margin:25px 0;">
                        <a href="%s/campaigns" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;padding:12px 35px;border-radius:12px;font-weight:600;">
                            🎯 Explore More Campaigns
                        </a>
                    </div>

                    <div style="text-align:center;margin:20px 0;">
                        <p style="color:#64748b;font-size:12px;">Share your impact:</p>
                        <a href="https://twitter.com/intent/tweet?text=I+donated+to+DaanSetu!+Join+me+in+making+a+difference" style="color:#3b82f6;margin:0 8px;font-size:13px;">Twitter</a>
                        <a href="https://www.facebook.com/sharer.php?u=https://daansetu.org" style="color:#3b82f6;margin:0 8px;font-size:13px;">Facebook</a>
                        <a href="https://wa.me/?text=I+donated+to+DaanSetu!+Join+me:+https://daansetu.org" style="color:#3b82f6;margin:0 8px;font-size:13px;">WhatsApp</a>
                    </div>
                </div>
            </div>
            """.formatted(
                user.getName(),
                String.format("%,.2f", donation.getAmount()),
                donation.getCampaign().getTitle(),
                String.format("%,.0f", donation.getAmount().doubleValue()),
                frontendUrl
        );

        sendHtmlEmail(user.getEmail(), subject, html, "thank_you");
    }

    @Async
    public void sendDonationCreatedEmailToStakeholders(Donation donation) {
        if (donation == null || donation.getUser() == null || donation.getCampaign() == null) {
            return;
        }

        User donor = donation.getUser();
        NGO ngo = donation.getCampaign().getNgo();
        String ngoEmail = ngo != null ? ngo.getEmail() : null;
        String ngoName = ngo != null ? ngo.getNgoName() : "NGO";
        String donorName = donor.getName() != null ? donor.getName() : "Donor";
        String donationType = resolveDonationTypeLabel(donation);
        String amount = donation.getAmount() != null ? String.format("%,.2f", donation.getAmount()) : "0.00";
        String status = donation.getDonationStatus() != null ? donation.getDonationStatus().name() : "PENDING";
        boolean showAmount = donation.getDonationType() == com.daansetu.enums.DonationType.MONEY
            || (donation.getAmount() != null && donation.getAmount().compareTo(BigDecimal.ZERO) > 0);
        String amountLine = showAmount
            ? "<p><strong>Amount/Value:</strong> \u20b9%s</p>".formatted(safe(amount))
            : "";

        if (donor.getEmail() != null && !donor.getEmail().isBlank()) {
            String donorSubject = "Donation Created Successfully";
            String donorHtml = """
                <div style=\"font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;\">
                    <h2>Hello %s,</h2>
                    <p>Your donation entry has been created successfully.</p>
                    <p><strong>Donation Type:</strong> %s</p>
                    %s
                    <p><strong>Status:</strong> %s</p>
                    <p><strong>Campaign:</strong> %s</p>
                </div>
                """.formatted(safe(donorName), safe(donationType), amountLine, safe(status), safe(donation.getCampaign().getTitle()));
            sendHtmlEmail(donor.getEmail().trim(), donorSubject, donorHtml, "donation_created_donor");
        }

        if (ngoEmail != null && !ngoEmail.isBlank()) {
            String ngoSubject = "New Donation Created";
            String ngoHtml = """
                <div style=\"font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;\">
                    <h2>Hello %s,</h2>
                    <p>A new donation entry is now visible in your dashboard.</p>
                    <p><strong>Donor:</strong> %s</p>
                    <p><strong>Type:</strong> %s</p>
                    %s
                    <p><strong>Status:</strong> %s</p>
                </div>
                """.formatted(safe(ngoName), safe(donorName), safe(donationType), amountLine, safe(status));
            sendHtmlEmail(ngoEmail.trim(), ngoSubject, ngoHtml, "donation_created_ngo");
        }

        userRepository.findByRole(UserRole.ADMIN, Pageable.unpaged()).forEach(admin -> {
            if (admin.getEmail() == null || admin.getEmail().isBlank()) {
                return;
            }
            String adminSubject = "New Donation Recorded";
            String adminHtml = """
                <div style=\"font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;\">
                    <h2>Hello Admin,</h2>
                    <p>A new donation has been created in the system.</p>
                    <p><strong>Donation ID:</strong> %s</p>
                    <p><strong>Donor:</strong> %s</p>
                    <p><strong>NGO:</strong> %s</p>
                    <p><strong>Type:</strong> %s</p>
                    <p><strong>Status:</strong> %s</p>
                </div>
                """.formatted(
                    donation.getDonationId(),
                    safe(donorName),
                    safe(ngoName),
                    safe(donationType),
                    safe(status)
            );
            sendHtmlEmail(admin.getEmail().trim(), adminSubject, adminHtml, "donation_created_admin");
        });
    }

    @Async
    public void sendPickupRequestCreatedEmailToStakeholders(PickupRequest pickup) {
        if (pickup == null || pickup.getDonation() == null) {
            return;
        }

        User donor = pickup.getDonation().getUser();
        NGO ngo = pickup.getDonation().getCampaign() != null ? pickup.getDonation().getCampaign().getNgo() : null;
        String ngoEmail = ngo != null ? ngo.getEmail() : null;
        String ngoName = ngo != null ? ngo.getNgoName() : "NGO";
        String donorName = donor != null && donor.getName() != null ? donor.getName() : "Donor";
        String details = resolveDateTime(pickup) + " | " + safe(pickup.getDonorAddress());

        if (donor != null && donor.getEmail() != null && !donor.getEmail().isBlank()) {
            String subject = "Pickup Request Created";
            String html = """
                <div style=\"font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;\">
                    <h2>Hello %s,</h2>
                    <p>Your pickup request was created and is pending NGO/Admin review.</p>
                    <p><strong>Schedule:</strong> %s</p>
                </div>
                """.formatted(safe(donorName), safe(details));
            sendHtmlEmail(donor.getEmail().trim(), subject, html, "pickup_created_donor");
        }

        if (ngoEmail != null && !ngoEmail.isBlank()) {
            String subject = "New Pickup Request Created";
            String html = """
                <div style=\"font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;\">
                    <h2>Hello %s,</h2>
                    <p>A new pickup request requires review.</p>
                    <p><strong>Donor:</strong> %s</p>
                    <p><strong>Schedule:</strong> %s</p>
                </div>
                """.formatted(safe(ngoName), safe(donorName), safe(details));
            sendHtmlEmail(ngoEmail.trim(), subject, html, "pickup_created_ngo");
        }

        userRepository.findByRole(UserRole.ADMIN, Pageable.unpaged()).forEach(admin -> {
            if (admin.getEmail() == null || admin.getEmail().isBlank()) {
                return;
            }

            String subject = "Pickup Request Logged";
            String html = """
                <div style=\"font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;\">
                    <h2>Hello Admin,</h2>
                    <p>A new pickup request has been logged.</p>
                    <p><strong>Pickup ID:</strong> %s</p>
                    <p><strong>Donor:</strong> %s</p>
                    <p><strong>NGO:</strong> %s</p>
                    <p><strong>Schedule:</strong> %s</p>
                </div>
                """.formatted(pickup.getPickupId(), safe(donorName), safe(ngoName), safe(details));
            sendHtmlEmail(admin.getEmail().trim(), subject, html, "pickup_created_admin");
        });
    }

    @Async
    public void sendVolunteerAppliedEmailToApprovers(PickupRequest pickup, Volunteer volunteer) {
        if (pickup == null || pickup.getDonation() == null || volunteer == null || volunteer.getUser() == null) {
            return;
        }

        String ngoEmail = pickup.getDonation().getCampaign() != null && pickup.getDonation().getCampaign().getNgo() != null
                ? pickup.getDonation().getCampaign().getNgo().getEmail()
                : null;
        String ngoName = pickup.getDonation().getCampaign() != null && pickup.getDonation().getCampaign().getNgo() != null
                ? pickup.getDonation().getCampaign().getNgo().getNgoName()
                : "NGO";
        String volunteerName = volunteer.getUser().getName() != null ? volunteer.getUser().getName() : "Volunteer";
        String donorName = pickup.getDonation().getUser() != null && pickup.getDonation().getUser().getName() != null
                ? pickup.getDonation().getUser().getName()
                : "Donor";

        if (ngoEmail != null && !ngoEmail.isBlank()) {
            String subject = "Volunteer Applied for Pickup";
            String html = """
                <div style=\"font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;\">
                    <h2>Hello %s,</h2>
                    <p>A volunteer has applied for a pickup request.</p>
                    <p><strong>Volunteer:</strong> %s</p>
                    <p><strong>Donor:</strong> %s</p>
                    <p><strong>Pickup ID:</strong> %s</p>
                </div>
                """.formatted(safe(ngoName), safe(volunteerName), safe(donorName), pickup.getPickupId());
            sendHtmlEmail(ngoEmail.trim(), subject, html, "volunteer_applied_ngo");
        }

        userRepository.findByRole(UserRole.ADMIN, Pageable.unpaged()).forEach(admin -> {
            if (admin.getEmail() == null || admin.getEmail().isBlank()) {
                return;
            }
            String subject = "Volunteer Application Received";
            String html = """
                <div style=\"font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;\">
                    <h2>Hello Admin,</h2>
                    <p>Volunteer application received for a pickup request.</p>
                    <p><strong>Pickup ID:</strong> %s</p>
                    <p><strong>Volunteer:</strong> %s</p>
                    <p><strong>Donor:</strong> %s</p>
                    <p><strong>NGO:</strong> %s</p>
                </div>
                """.formatted(pickup.getPickupId(), safe(volunteerName), safe(donorName), safe(ngoName));
            sendHtmlEmail(admin.getEmail().trim(), subject, html, "volunteer_applied_admin");
        });
    }

    @Async
    public void sendPickupAssignmentConfirmationToAdmins(PickupRequest pickup, Volunteer volunteer) {
        if (pickup == null || pickup.getDonation() == null) {
            return;
        }

        String ngoEmail = pickup.getDonation().getCampaign() != null && pickup.getDonation().getCampaign().getNgo() != null
                ? pickup.getDonation().getCampaign().getNgo().getEmail()
                : null;
        String ngoName = pickup.getDonation().getCampaign() != null && pickup.getDonation().getCampaign().getNgo() != null
                ? pickup.getDonation().getCampaign().getNgo().getNgoName()
                : "NGO";
        String volunteerName = volunteer != null && volunteer.getUser() != null && volunteer.getUser().getName() != null
                ? volunteer.getUser().getName()
                : "Volunteer";
        String donorName = pickup.getDonation().getUser() != null && pickup.getDonation().getUser().getName() != null
                ? pickup.getDonation().getUser().getName()
                : "Donor";

        if (ngoEmail != null && !ngoEmail.isBlank()) {
            String subject = "Pickup Assigned";
            String html = """
                <div style=\"font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;\">
                    <h2>Hello %s,</h2>
                    <p>Pickup has been assigned to a volunteer.</p>
                    <p><strong>Pickup ID:</strong> %s</p>
                    <p><strong>Volunteer:</strong> %s</p>
                    <p><strong>Donor:</strong> %s</p>
                </div>
                """.formatted(safe(ngoName), pickup.getPickupId(), safe(volunteerName), safe(donorName));
            sendHtmlEmail(ngoEmail.trim(), subject, html, "pickup_assigned_ngo");
        }

        userRepository.findByRole(UserRole.ADMIN, Pageable.unpaged()).forEach(admin -> {
            if (admin.getEmail() == null || admin.getEmail().isBlank()) {
                return;
            }
            String subject = "Pickup Assignment Confirmed";
            String html = """
                <div style=\"font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;\">
                    <h2>Hello Admin,</h2>
                    <p>Volunteer assignment has been confirmed.</p>
                    <p><strong>Pickup ID:</strong> %s</p>
                    <p><strong>Volunteer:</strong> %s</p>
                    <p><strong>Donor:</strong> %s</p>
                    <p><strong>NGO:</strong> %s</p>
                </div>
                """.formatted(pickup.getPickupId(), safe(volunteerName), safe(donorName), safe(ngoName));
            sendHtmlEmail(admin.getEmail().trim(), subject, html, "pickup_assigned_admin");
        });
    }

    @Async
    public void sendNgoNotificationEmail(String toEmail, String ngoName, String title, String message) {
        if (toEmail == null || toEmail.isBlank()) {
            return;
        }

        String safeNgoName = ngoName != null && !ngoName.isBlank() ? ngoName : "NGO";
        String safeTitle = title != null && !title.isBlank() ? title : "Notification";
        String safeMessage = message != null && !message.isBlank() ? message : "You have a new notification.";

        String subject = "[DaanSetu] " + safeTitle;
        String html = """
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:30px 24px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:24px;">%s</h1>
                    <p style="color:#bfdbfe;margin:8px 0 0;font-size:13px;">NGO Notification</p>
                </div>
                <div style="padding:24px;">
                    <h2 style="color:#e2e8f0;margin:0 0 12px;font-size:20px;">%s</h2>
                    <p style="color:#94a3b8;font-size:15px;line-height:1.7;white-space:pre-wrap;">%s</p>
                    <div style="margin-top:20px;text-align:center;">
                        <a href="%s" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 24px;border-radius:10px;font-weight:600;">
                            Open DaanSetu
                        </a>
                    </div>
                </div>
            </div>
            """.formatted(safeNgoName, safeTitle, safeMessage, frontendUrl);

        sendHtmlEmail(toEmail.trim(), subject, html, "ngo_notification");
    }

    @Async
    public void sendPickupApprovalRequestEmail(PickupRequest pickup) {
        if (pickup == null || pickup.getDonation() == null || pickup.getDonation().getCampaign() == null
                || pickup.getDonation().getCampaign().getNgo() == null) {
            return;
        }

        String ngoEmail = pickup.getDonation().getCampaign().getNgo().getEmail();
        if (ngoEmail == null || ngoEmail.isBlank()) {
            return;
        }

        User donor = pickup.getDonation().getUser();
        String donorName = donor != null && donor.getName() != null ? donor.getName() : "Donor";

        String subject = "New Pickup Request for Approval";
        String html = """
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;">
                <h2>Hello Admin,</h2>
                <p>A new donation pickup request has been submitted.</p>
                <p><strong>Donor Name:</strong> %s</p>
                <p><strong>Donation Type:</strong> %s</p>
                <p><strong>Address:</strong> %s</p>
                <p><strong>Preferred Time:</strong> %s</p>
                <p><strong>Request Logged At:</strong> %s</p>
                <p>Please review and approve/reject this request.</p>
                <p>Thank you.</p>
            </div>
            """.formatted(
                safe(donorName),
                safe(resolveItemType(pickup)),
                safe(pickup.getDonorAddress()),
                safe(resolveDateTime(pickup)),
                safe(formatActionTimestamp(LocalDateTime.now()))
        );

        sendHtmlEmail(ngoEmail.trim(), subject, html, "pickup_admin_approval");
    }

    @Async
    public void sendDonorPickupApprovedEmail(PickupRequest pickup) {
        if (pickup == null || pickup.getDonation() == null || pickup.getDonation().getUser() == null) {
            return;
        }

        User donor = pickup.getDonation().getUser();
        if (donor.getEmail() == null || donor.getEmail().isBlank()) {
            return;
        }

        String subject = "Pickup Request Approved";
        String html = """
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;">
                <h2>Hello %s,</h2>
                <p>Your pickup request has been approved by the NGO.</p>
                <p>It is now waiting for volunteer assignment.</p>
                <p><strong>Pickup Time:</strong> %s</p>
                <p><strong>Address:</strong> %s</p>
                <p><strong>Approved At:</strong> %s</p>
                <p>Thank you for supporting DaanSetu.</p>
            </div>
            """.formatted(
                safe(donor.getName()),
                safe(resolveDateTime(pickup)),
                safe(pickup.getDonorAddress()),
                safe(formatActionTimestamp(LocalDateTime.now()))
        );

        sendHtmlEmail(donor.getEmail().trim(), subject, html, "pickup_donor_approved");
    }

    @Async
    public void sendDonorPickupAssignedEmail(PickupRequest pickup, Volunteer volunteer) {
        if (pickup == null || pickup.getDonation() == null || pickup.getDonation().getUser() == null) {
            return;
        }

        User donor = pickup.getDonation().getUser();
        if (donor.getEmail() == null || donor.getEmail().isBlank()) {
            return;
        }

        String volunteerName = volunteer != null && volunteer.getUser() != null && volunteer.getUser().getName() != null
                ? volunteer.getUser().getName()
                : "Volunteer";
        String volunteerPhone = volunteer != null && volunteer.getUser() != null && volunteer.getUser().getPhone() != null
                ? volunteer.getUser().getPhone()
                : "Not shared";

        String subject = "Pickup Assigned Successfully";
        String html = """
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;">
                <h2>Hello %s,</h2>
                <p>A volunteer has been assigned to your donation pickup.</p>
                <p><strong>Volunteer Name:</strong> %s</p>
                <p><strong>Contact:</strong> %s</p>
                <p><strong>Pickup Time:</strong> %s</p>
                <p><strong>Assigned At:</strong> %s</p>
                <p>Thank you for your contribution!</p>
            </div>
            """.formatted(
                safe(donor.getName()),
                safe(volunteerName),
                safe(volunteerPhone),
                safe(resolveDateTime(pickup)),
                safe(formatActionTimestamp(LocalDateTime.now()))
        );

        sendHtmlEmail(donor.getEmail().trim(), subject, html, "pickup_donor_assigned");
    }

    @Async
    public void sendVolunteerPickupAssignedEmail(PickupRequest pickup, Volunteer volunteer) {
        if (pickup == null || volunteer == null || volunteer.getUser() == null) {
            return;
        }

        User volunteerUser = volunteer.getUser();
        if (volunteerUser.getEmail() == null || volunteerUser.getEmail().isBlank()) {
            return;
        }

        User donor = pickup.getDonation() != null ? pickup.getDonation().getUser() : null;
        String donorName = donor != null && donor.getName() != null ? donor.getName() : "Donor";

        String subject = "New Pickup Task Assigned";
        String html = """
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;">
                <h2>Hello %s,</h2>
                <p>You have been assigned a new pickup task.</p>
                <p><strong>Donor Name:</strong> %s</p>
                <p><strong>Address:</strong> %s</p>
                <p><strong>Item Type:</strong> %s</p>
                <p><strong>Pickup Time:</strong> %s</p>
                <p><strong>Assigned At:</strong> %s</p>
                <p>Please complete the task on time.</p>
                <p>Thank you.</p>
            </div>
            """.formatted(
                safe(volunteerUser.getName()),
                safe(donorName),
                safe(pickup.getDonorAddress()),
                safe(resolveItemType(pickup)),
                safe(resolveDateTime(pickup)),
                safe(formatActionTimestamp(LocalDateTime.now()))
        );

        sendHtmlEmail(volunteerUser.getEmail().trim(), subject, html, "pickup_volunteer_assigned");
    }

    @Async
    public void sendPickupVerificationOtpEmail(PickupRequest pickup, Volunteer volunteer) {
        if (pickup == null || pickup.getDonation() == null || pickup.getDonation().getUser() == null) {
            return;
        }

        User donor = pickup.getDonation().getUser();
        if (donor.getEmail() == null || donor.getEmail().isBlank()) {
            return;
        }

        String donorEmail = donor.getEmail().trim();
        String pickupOtpKey = pickupOtpKey(pickup.getPickupId());
        otpRepository.deleteByPhoneAndPurpose(pickupOtpKey, PICKUP_OTP_PURPOSE);

        String otp = generateOtp();
        OtpRecord otpRecord = OtpRecord.builder()
                .phone(pickupOtpKey)
                .email(donorEmail)
                .otp(otp)
                .purpose(PICKUP_OTP_PURPOSE)
                .expiryDate(LocalDateTime.now().plusMinutes(verificationOtpExpiryMinutes))
                .build();
        otpRepository.save(otpRecord);

        String volunteerName = volunteer != null && volunteer.getUser() != null && volunteer.getUser().getName() != null
                ? volunteer.getUser().getName()
                : "Assigned volunteer";

        String subject = "Pickup OTP Verification Code";
        String html = """
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;">
                <h2>Hello %s,</h2>
                <p>Your pickup volunteer has been assigned. Share this OTP only after the volunteer reaches your location.</p>
                <p><strong>Volunteer:</strong> %s</p>
                <p><strong>Pickup Time:</strong> %s</p>
                <div style="text-align:center;margin:20px 0;padding:16px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;">
                    <p style="margin:0 0 6px;color:#475569;">Your Pickup OTP</p>
                    <h1 style="margin:0;font-size:34px;letter-spacing:8px;font-family:monospace;color:#1e40af;">%s</h1>
                    <p style="margin:6px 0 0;color:#64748b;font-size:12px;">Valid for %d minutes</p>
                </div>
                <p>Do not share this code on phone/chat. Provide it only to the volunteer at pickup time.</p>
            </div>
            """.formatted(
                safe(donor.getName()),
                safe(volunteerName),
                safe(resolveDateTime(pickup)),
                otp,
                verificationOtpExpiryMinutes
        );

        sendHtmlEmail(donorEmail, subject, html, "pickup_verification_otp");
    }

    public void verifyPickupOtp(PickupRequest pickup, String providedOtp) {
        if (pickup == null || pickup.getPickupId() == null || pickup.getDonation() == null || pickup.getDonation().getUser() == null) {
            throw new IllegalArgumentException("Pickup context is required for OTP verification");
        }

        String donorEmail = pickup.getDonation().getUser().getEmail();
        if (donorEmail == null || donorEmail.isBlank()) {
            throw new IllegalArgumentException("Donor email is required for OTP verification");
        }

        OtpRecord otpRecord = otpRepository
                .findTopByPhoneAndEmailAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(
                        pickupOtpKey(pickup.getPickupId()),
                        donorEmail.trim(),
                        PICKUP_OTP_PURPOSE)
                .orElseThrow(() -> new IllegalArgumentException("No active OTP found. Please resend OTP from assignment flow."));

        if (otpRecord.isExpired()) {
            throw new IllegalArgumentException("OTP has expired. Please request a new OTP.");
        }

        if (otpRecord.getAttempts() >= 3) {
            throw new IllegalArgumentException("Maximum OTP attempts exceeded. Please request a new OTP.");
        }

        otpRecord.setAttempts(otpRecord.getAttempts() + 1);
        if (!otpRecord.getOtp().equals(providedOtp)) {
            otpRepository.save(otpRecord);
            throw new IllegalArgumentException("Invalid OTP. Please check and try again.");
        }

        otpRecord.setVerified(true);
        otpRepository.save(otpRecord);
    }

    @Async
    public void sendDonorPickupInProgressEmail(PickupRequest pickup, Volunteer volunteer) {
        if (pickup == null || pickup.getDonation() == null || pickup.getDonation().getUser() == null) {
            return;
        }

        User donor = pickup.getDonation().getUser();
        if (donor.getEmail() == null || donor.getEmail().isBlank()) {
            return;
        }

        String volunteerName = volunteer != null && volunteer.getUser() != null && volunteer.getUser().getName() != null
                ? volunteer.getUser().getName()
                : "Volunteer";

        String subject = "Pickup In Progress";
        String html = """
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;">
                <h2>Hello %s,</h2>
                <p>Your assigned volunteer has started the pickup and is on the way.</p>
                <p><strong>Volunteer:</strong> %s</p>
                <p><strong>Pickup Time:</strong> %s</p>
                <p><strong>Started At:</strong> %s</p>
                <p>Thank you for your patience.</p>
            </div>
            """.formatted(
                safe(donor.getName()),
                safe(volunteerName),
                safe(resolveDateTime(pickup)),
                safe(formatActionTimestamp(LocalDateTime.now()))
        );

        sendHtmlEmail(donor.getEmail().trim(), subject, html, "pickup_in_progress");
    }

    @Async
    public void sendPickupCompletedEmailToStakeholders(PickupRequest pickup, Volunteer volunteer) {
        if (pickup == null || pickup.getDonation() == null) {
            return;
        }

        User donor = pickup.getDonation().getUser();
        User volunteerUser = volunteer != null ? volunteer.getUser() : null;
        String ngoEmail = pickup.getDonation().getCampaign() != null && pickup.getDonation().getCampaign().getNgo() != null
                ? pickup.getDonation().getCampaign().getNgo().getEmail()
                : null;

        String donorName = donor != null && donor.getName() != null ? donor.getName() : "Donor";
        String volunteerName = volunteerUser != null && volunteerUser.getName() != null ? volunteerUser.getName() : "Volunteer";
        String itemType = resolveItemType(pickup);

        if (donor != null && donor.getEmail() != null && !donor.getEmail().isBlank()) {
            String donorSubject = "Donation Completed";
            String donorHtml = """
                <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;">
                    <h2>Hello %s,</h2>
                    <p>Your donation has been successfully collected and delivered to the NGO.</p>
                    <p><strong>Volunteer:</strong> %s</p>
                    <p><strong>Items:</strong> %s</p>
                    <p><strong>Completed At:</strong> %s</p>
                    <p>Thank you for your generous contribution.</p>
                </div>
                """.formatted(safe(donorName), safe(volunteerName), safe(itemType), safe(formatActionTimestamp(LocalDateTime.now())));
            sendHtmlEmail(donor.getEmail().trim(), donorSubject, donorHtml, "pickup_completed_donor");
        }

        if (volunteerUser != null && volunteerUser.getEmail() != null && !volunteerUser.getEmail().isBlank()) {
            String volunteerSubject = "Task Completed";
            String volunteerHtml = """
                <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;">
                    <h2>Hello %s,</h2>
                    <p>Thank you for completing your assigned pickup task.</p>
                    <p><strong>Donor:</strong> %s</p>
                    <p><strong>Items:</strong> %s</p>
                    <p><strong>Completed At:</strong> %s</p>
                    <p>Your contribution is making a real impact.</p>
                </div>
                """.formatted(safe(volunteerName), safe(donorName), safe(itemType), safe(formatActionTimestamp(LocalDateTime.now())));
            sendHtmlEmail(volunteerUser.getEmail().trim(), volunteerSubject, volunteerHtml, "pickup_completed_volunteer");
        }

        if (ngoEmail != null && !ngoEmail.isBlank()) {
            String ngoSubject = "Pickup Completed";
            String ngoHtml = """
                <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;">
                    <h2>Hello Admin,</h2>
                    <p>The pickup task has been completed and items are marked as received at NGO.</p>
                    <p><strong>Donor:</strong> %s</p>
                    <p><strong>Volunteer:</strong> %s</p>
                    <p><strong>Items:</strong> %s</p>
                    <p><strong>Completed At:</strong> %s</p>
                </div>
                """.formatted(safe(donorName), safe(volunteerName), safe(itemType), safe(formatActionTimestamp(LocalDateTime.now())));
            sendHtmlEmail(ngoEmail.trim(), ngoSubject, ngoHtml, "pickup_completed_ngo");
        }

        userRepository.findByRole(UserRole.ADMIN, Pageable.unpaged()).forEach(admin -> {
            if (admin.getEmail() == null || admin.getEmail().isBlank()) {
                return;
            }
            String adminSubject = "Pickup Task Completed";
            String adminHtml = """
                <div style=\"font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;\">
                    <h2>Hello Admin,</h2>
                    <p>A pickup and delivery workflow has been completed.</p>
                    <p><strong>Pickup ID:</strong> %s</p>
                    <p><strong>Donor:</strong> %s</p>
                    <p><strong>Volunteer:</strong> %s</p>
                    <p><strong>Items:</strong> %s</p>
                    <p><strong>Completed At:</strong> %s</p>
                </div>
                """.formatted(
                    pickup.getPickupId(),
                    safe(donorName),
                    safe(volunteerName),
                    safe(itemType),
                    safe(formatActionTimestamp(LocalDateTime.now()))
            );
            sendHtmlEmail(admin.getEmail().trim(), adminSubject, adminHtml, "pickup_completed_admin");
        });
    }

    @Async
    public void sendReceiptPdfToStakeholders(Donation donation, DonationReceipt receipt, byte[] receiptPdf) {
        if (donation == null || receipt == null || receiptPdf == null || receiptPdf.length == 0) {
            return;
        }

        User donor = donation.getUser();
        String ngoEmail = donation.getCampaign() != null && donation.getCampaign().getNgo() != null
                ? donation.getCampaign().getNgo().getEmail()
                : null;

        String subject = "Donation Receipt PDF - " + receipt.getReceiptNumber();
        String body = """
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;line-height:1.6;">
                <h2>Donation Receipt Attached</h2>
                <p><strong>Donation ID:</strong> %s</p>
                <p><strong>Donor Name:</strong> %s</p>
                <p><strong>Type:</strong> %s</p>
                <p><strong>Date:</strong> %s</p>
                <p><strong>NGO:</strong> %s</p>
                <p>The official PDF receipt is attached with this email.</p>
            </div>
            """.formatted(
                donation.getDonationId(),
                donation.isAnonymous() ? "Anonymous" : safe(donor != null ? donor.getName() : null),
                donation.getDonationType() != null ? donation.getDonationType().name() : "N/A",
                safe(formatActionTimestamp(donation.getDonationDate())),
                safe(donation.getCampaign() != null && donation.getCampaign().getNgo() != null
                        ? donation.getCampaign().getNgo().getNgoName()
                        : null)
        );

        String attachmentName = "DaanSetu_Receipt_" + receipt.getReceiptNumber() + ".pdf";

        if (donor != null && donor.getEmail() != null && !donor.getEmail().isBlank()) {
            sendHtmlEmailWithAttachment(donor.getEmail().trim(), subject, body, "receipt_pdf_donor", attachmentName, receiptPdf);
        }

        if (ngoEmail != null && !ngoEmail.isBlank()) {
            sendHtmlEmailWithAttachment(ngoEmail.trim(), subject, body, "receipt_pdf_ngo", attachmentName, receiptPdf);
        }

        userRepository.findByRole(com.daansetu.enums.UserRole.ADMIN, Pageable.unpaged())
                .forEach(admin -> {
                    if (admin.getEmail() != null && !admin.getEmail().isBlank()) {
                        sendHtmlEmailWithAttachment(admin.getEmail().trim(), subject, body, "receipt_pdf_admin", attachmentName, receiptPdf);
                    }
                });
    }

    // ============================================
    // CORE SEND METHOD
    // ============================================
    public void sendTestEmail(String to) throws MessagingException, MailException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject("✅ DaanSetu – SMTP Test");
        helper.setText(
                """
                <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;">
                    <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:32px 24px;text-align:center;">
                        <h1 style="color:#fff;margin:0;font-size:28px;">✅ SMTP Test Successful</h1>
                    </div>
                    <div style="padding:24px;">
                        <p style="color:#e2e8f0;font-size:16px;line-height:1.6;">
                            This is a live test email from the DaanSetu backend.
                        </p>
                        <p style="color:#94a3b8;font-size:14px;line-height:1.6;">
                            If you received this message, the Gmail SMTP configuration is working correctly.
                        </p>
                    </div>
                </div>
                """,
                true
        );

        mailSender.send(mimeMessage);
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent, String templateName) {
        EmailLog emailLog = EmailLog.builder()
                .recipientEmail(to)
                .subject(subject)
                .templateName(templateName)
                .status(EmailLog.EmailStatus.QUEUED)
                .build();

        if (!emailEnabled) {
            emailLog.setStatus(EmailLog.EmailStatus.FAILED);
            emailLog.setErrorMessage("Email sending is disabled by configuration.");
            emailLogRepository.save(emailLog);
            log.info("Email sending skipped for {} [{}] because app.email.enabled=false", to, templateName);
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);

            emailLog.setStatus(EmailLog.EmailStatus.SENT);
            emailLog.setSentAt(LocalDateTime.now());
            log.info("Email sent successfully to: {} [{}]", to, templateName);

        } catch (MessagingException | MailException e) {
            emailLog.setStatus(EmailLog.EmailStatus.FAILED);
            emailLog.setErrorMessage(e.getMessage());
            log.warn("Failed to send email to: {} [{}] - {}", to, templateName, e.getMessage());
        }

        emailLogRepository.save(emailLog);
    }

    private void sendHtmlEmailWithAttachment(
            String to,
            String subject,
            String htmlContent,
            String templateName,
            String attachmentName,
            byte[] attachmentBytes
    ) {
        EmailLog emailLog = EmailLog.builder()
                .recipientEmail(to)
                .subject(subject)
                .templateName(templateName)
                .status(EmailLog.EmailStatus.QUEUED)
                .build();

        if (!emailEnabled) {
            emailLog.setStatus(EmailLog.EmailStatus.FAILED);
            emailLog.setErrorMessage("Email sending is disabled by configuration.");
            emailLogRepository.save(emailLog);
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            helper.addAttachment(attachmentName, new ByteArrayResource(attachmentBytes));

            mailSender.send(mimeMessage);
            emailLog.setStatus(EmailLog.EmailStatus.SENT);
            emailLog.setSentAt(LocalDateTime.now());
        } catch (MessagingException | MailException e) {
            emailLog.setStatus(EmailLog.EmailStatus.FAILED);
            emailLog.setErrorMessage(e.getMessage());
            log.warn("Failed to send email with attachment to {} [{}] - {}", to, templateName, e.getMessage());
        }

        emailLogRepository.save(emailLog);
    }

    private String generateOtp() {
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            otp.append((int) (Math.random() * 10));
        }
        return otp.toString();
    }

    private String resolveOtpPhone(User user) {
        String userPhone = user.getPhone();
        if (userPhone != null && !userPhone.isBlank()) {
            return userPhone.trim();
        }
        // otp_records.phone is NOT NULL in current schema; keep a stable non-null placeholder for email OTP rows.
        return "EMAIL_ONLY";
    }

    private String resolveDateTime(PickupRequest pickup) {
        String date = pickup.getPickupDate() != null ? pickup.getPickupDate().toString() : "Not specified";
        String slot = pickup.getTimeSlot() != null && !pickup.getTimeSlot().isBlank()
                ? pickup.getTimeSlot().trim()
                : "Not specified";
        return date + " " + slot;
    }

    private String formatActionTimestamp(LocalDateTime timestamp) {
        LocalDateTime value = timestamp != null ? timestamp : LocalDateTime.now();
        return value.format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
    }

    private String resolveItemType(PickupRequest pickup) {
        if (pickup.getDonation() == null || pickup.getDonation().getDonationType() == null) {
            return "Goods";
        }

        return switch (pickup.getDonation().getDonationType()) {
            case CLOTHES -> "Clothes";
            case FOOD -> "Food";
            case BOOKS -> "Books";
            case MEDICINE -> "Medicine";
            default -> "Goods";
        };
    }

    private String resolveDonationTypeLabel(Donation donation) {
        if (donation == null || donation.getDonationType() == null) {
            return "Goods";
        }

        return switch (donation.getDonationType()) {
            case MONEY -> "Money";
            case FOOD -> "Food";
            case CLOTHES -> "Clothes";
            case BOOKS -> "Books";
            case MEDICINE -> "Medicine";
            case OTHER -> {
                if (donation.getDonationId() == null) {
                    yield "Goods";
                }

                List<String> categories = donationItemRepository.findByDonationDonationId(donation.getDonationId())
                        .stream()
                        .map(item -> item.getCategory() != null && !item.getCategory().isBlank()
                                ? item.getCategory()
                                : item.getItemName())
                        .filter(value -> value != null && !value.isBlank())
                        .map(String::trim)
                        .map(String::toLowerCase)
                        .map(value -> {
                            if ("cloth".equals(value) || "cloths".equals(value)) return "clothes";
                            if ("book".equals(value)) return "books";
                            return value;
                        })
                        .map(value -> value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1))
                        .distinct()
                        .collect(Collectors.toList());

                yield categories.isEmpty() ? "Goods" : String.join(", ", categories);
            }
        };
    }

    private String safe(String value) {
        return value != null && !value.isBlank() ? value.trim() : "N/A";
    }

    private String pickupOtpKey(Long pickupId) {
        return "PICKUP_OTP_" + pickupId;
    }
}
