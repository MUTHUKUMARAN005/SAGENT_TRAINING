// src/main/java/com/daansetu/service/DonationService.java
package com.daansetu.service;

import com.daansetu.dto.request.DonationRequestDTO;
import com.daansetu.dto.response.DonationResponse;
import com.daansetu.dto.response.PageResponse;
import com.daansetu.entity.*;
import com.daansetu.enums.*;
import com.daansetu.exception.*;
import com.daansetu.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DonationService {

    private final DonationRepository donationRepository;
    private final CampaignRepository campaignRepository;
    private final NGORepository ngoRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final DonationItemRepository donationItemRepository;
    private final DonationReceiptRepository receiptRepository;
    private final NotificationRepository notificationRepository;
    private final BlockchainService blockchainService;
    private final EmailService emailService;
    private final SmsService smsService;
    private final WebSocketService webSocketService;
    private final ReceiptService receiptService;

    @Transactional
    public DonationResponse makeDonation(Long userId, DonationRequestDTO request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Campaign campaign = campaignRepository.findById(request.getCampaignId())
                .orElseThrow(() -> new ResourceNotFoundException("Campaign", "id", request.getCampaignId()));

        if (campaign.getCampaignStatus() != CampaignStatus.ACTIVE) {
            throw new BadRequestException("Campaign is not active");
        }

        validateDonationRequest(request);
        boolean isMonetaryRequest = request.getDonationType() == DonationType.MONEY;
        PaymentMethod paymentMethod = isMonetaryRequest ? resolveSupportedPaymentMethod(request.getPaymentMethod()) : null;

        // 1. Create Donation
        Donation donation = Donation.builder()
                .user(user)
                .campaign(campaign)
                .donationType(request.getDonationType())
                .amount(request.getAmount())
                .donationStatus(DonationStatus.PENDING)
                .message(request.getMessage())
                .anonymous(request.isAnonymous())
                .build();
        donation = donationRepository.save(donation);

        if (!isMonetaryRequest) {
            createDonationItemsForPhysicalDonation(donation, request);
        }

        Payment payment = null;
        if (isMonetaryRequest) {
            // 2. Create Payment for monetary donations
            payment = Payment.builder()
                .donation(donation)
                .paymentMethod(paymentMethod)
                .transactionId(request.getTransactionId() != null ? request.getTransactionId() : "TXN" + System.currentTimeMillis())
                .amount(request.getAmount())
                .paymentStatus(PaymentStatus.SUCCESS)
                .build();
            paymentRepository.save(payment);
        }

        // 3. Update Donation Status
        donation.setDonationStatus(isMonetaryRequest ? DonationStatus.COMPLETED : DonationStatus.PENDING);
        donationRepository.save(donation);

        // 4. Update Campaign Progress
        if (isMonetaryRequest) {
            campaign.setCollectedAmount(campaign.getCollectedAmount().add(request.getAmount()));
        }
        campaign.setDonorsCount(campaign.getDonorsCount() + 1);
        campaignRepository.save(campaign);

        // 5. Generate receipt for monetary donations
        DonationReceipt receipt = isMonetaryDonation(donation) ? ensureReceiptForDonation(donation) : null;
        String receiptNumber = receipt != null ? receipt.getReceiptNumber() : "N/A";

        // 6. Record on Blockchain
        if (isMonetaryRequest) {
            blockchainService.recordDonation(donation);
        }

        // 7. Update PAN
        if (request.getPanNumber() != null && !request.getPanNumber().isBlank()) {
            user.setPanNumber(request.getPanNumber());
            userRepository.save(user);
        }

        // 8. Create Notification
        Notification notification = Notification.builder()
                .user(user)
                .title("Donation Successful! 🎉")
                .message(isMonetaryRequest
                    ? "Your donation of ₹" + String.format("%,.2f", request.getAmount()) +
                    " to \"" + campaign.getTitle() + "\" was successful."
                    : "Your physical donation request for \"" + campaign.getTitle() + "\" was submitted successfully.")
                .type(Notification.NotificationType.DONATION)
                .referenceId(donation.getDonationId())
                .referenceType("DONATION")
                .build();
        notificationRepository.save(notification);

        // 9. Build Response
        DonationResponse response = mapToResponse(donation, payment, receipt);

        // 10. ASYNC: Send Emails
        emailService.sendDonationCreatedEmailToStakeholders(donation);

        if (receipt != null) {
            emailService.sendDonationReceiptEmail(user, donation, receipt);
            generateAndDispatchReceipt(donation.getDonationId(), false);
        }
        emailService.sendThankYouEmail(user, donation);

        // 11. ASYNC: Send SMS Confirmation
        if (isMonetaryRequest && user.getPhone() != null && !user.getPhone().isBlank()) {
            smsService.sendDonationConfirmation(
                    user.getPhone(),
                    user.getName(),
                    String.format("%,.2f", request.getAmount()),
                    campaign.getTitle(),
                    receiptNumber
            );
        }

        // 12. WEBSOCKET: Broadcast live donation
        webSocketService.broadcastNewDonation(response);

        // 13. WEBSOCKET: Broadcast campaign progress
        webSocketService.broadcastCampaignProgress(
                campaign.getCampaignId(),
                campaign.getTitle(),
                campaign.getCollectedAmount(),
                campaign.getTargetAmount(),
                campaign.getDonorsCount()
        );

        // 14. WEBSOCKET: Send notification bell update
        webSocketService.sendNotification(
                userId,
                "Donation Confirmed",
            isMonetaryRequest
                ? "₹" + String.format("%,.2f", request.getAmount()) + " donated successfully"
                : "Physical donation request submitted successfully",
                "DONATION",
                donation.getDonationId()
        );

        log.info("Donation completed: User={}, Campaign={}, Amount=₹{}",
                user.getName(), campaign.getTitle(), request.getAmount());

        return response;
    }

    @Transactional(readOnly = true)
    public PageResponse<DonationResponse> getDonationsByUser(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Donation> donations = donationRepository.findByUserUserIdOrderByDonationDateDesc(userId, pageable);

        List<DonationResponse> content = donations.getContent().stream()
                .map(d -> mapToResponse(d, d.getPayment(), d.getReceipt()))
                .collect(Collectors.toList());

        return PageResponse.<DonationResponse>builder()
                .content(content)
                .page(donations.getNumber())
                .size(donations.getSize())
                .totalElements(donations.getTotalElements())
                .totalPages(donations.getTotalPages())
                .last(donations.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<DonationResponse> getAdminDonations(
            DonationType donationType,
            String paymentStatus,
            LocalDate dateFrom,
            LocalDate dateTo,
            int page,
            int size
    ) {
        if (dateFrom != null && dateTo != null && dateTo.isBefore(dateFrom)) {
            throw new BadRequestException("dateTo cannot be before dateFrom");
        }

        Boolean paymentConfirmed = resolvePaymentConfirmedFilter(paymentStatus);
        LocalDateTime fromDate = dateFrom != null ? dateFrom.atStartOfDay() : null;
        LocalDateTime toDateExclusive = dateTo != null ? dateTo.plusDays(1).atStartOfDay() : null;
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(1, Math.min(size, 200)),
                Sort.by(Sort.Direction.DESC, "donationDate")
        );

        Page<Donation> donations = donationRepository.findAllForAdminFilters(
                donationType,
                paymentConfirmed,
                fromDate,
                toDateExclusive,
                pageable
        );

        List<DonationResponse> content = donations.getContent().stream()
                .map(d -> mapToResponse(d, d.getPayment(), d.getReceipt()))
                .collect(Collectors.toList());

        return PageResponse.<DonationResponse>builder()
                .content(content)
                .page(donations.getNumber())
                .size(donations.getSize())
                .totalElements(donations.getTotalElements())
                .totalPages(donations.getTotalPages())
                .last(donations.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<DonationResponse> getDonationsByNgoAccess(Long ngoUserId, String ngoEmail, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "donationDate"));
        Page<Donation> donations = donationRepository.findByNgoAccessContextOrderByDonationDateDesc(ngoUserId, ngoEmail, pageable);

        if (donations.isEmpty()) {
            String ngoUserName = userRepository.findById(ngoUserId)
                    .map(User::getName)
                    .map(String::trim)
                    .orElse("");

            NGO ngoByEmail = ngoRepository.findByEmailIgnoreCase(ngoEmail).orElse(null);
            NGO ngoByName = !ngoUserName.isEmpty()
                    ? ngoRepository.findByNgoNameIgnoreCase(ngoUserName).stream().findFirst().orElse(null)
                    : null;

            NGO resolvedNgo = ngoByEmail;
            if (resolvedNgo == null || resolvedNgo.getCampaigns() == null || resolvedNgo.getCampaigns().isEmpty()) {
                if (ngoByName != null) {
                    resolvedNgo = ngoByName;
                }
            }

            if (resolvedNgo != null) {
                donations = donationRepository.findByCampaignNgoNgoIdOrderByDonationDateDesc(resolvedNgo.getNgoId(), pageable);
            }
        }

        List<DonationResponse> content = donations.getContent().stream()
                .map(d -> mapToResponse(d, d.getPayment(), d.getReceipt()))
                .collect(Collectors.toList());

        return PageResponse.<DonationResponse>builder()
                .content(content)
                .page(donations.getNumber())
                .size(donations.getSize())
                .totalElements(donations.getTotalElements())
                .totalPages(donations.getTotalPages())
                .last(donations.isLast())
                .build();
    }

    @Transactional
    public DonationResponse updateDonationPaymentStatusForAdmin(Long donationId, String paymentStatus) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation", "id", donationId));

        boolean confirmed = resolveRequiredPaymentConfirmed(paymentStatus);

        Payment payment = donation.getPayment();
        if (payment == null) {
            payment = Payment.builder()
                    .donation(donation)
                    .paymentMethod(PaymentMethod.UPI)
                    .transactionId("ADM-" + System.currentTimeMillis())
                    .amount(donation.getAmount())
                    .paymentStatus(PaymentStatus.PROCESSING)
                    .build();
        }

        payment.setPaymentStatus(confirmed ? PaymentStatus.SUCCESS : PaymentStatus.PROCESSING);
        paymentRepository.save(payment);

        donation.setDonationStatus(confirmed ? DonationStatus.COMPLETED : DonationStatus.PENDING);

        if (confirmed && isMonetaryDonation(donation)) {
            ensureReceiptForDonation(donation);
        }

        donationRepository.save(donation);

        return mapToResponse(donation, payment, donation.getReceipt());
    }

    @Transactional
    public DonationResponse generateDonationReceiptForAdmin(Long donationId) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation", "id", donationId));

        if (!isMonetaryDonation(donation)) {
            throw new BadRequestException("Receipt generation is only supported for monetary donations");
        }

        Payment payment = donation.getPayment();
        if (payment == null || payment.getPaymentStatus() != PaymentStatus.SUCCESS) {
            throw new BadRequestException("Payment must be confirmed before generating a receipt");
        }

        DonationReceipt receipt = ensureReceiptForDonation(donation);
        donationRepository.save(donation);
        generateAndDispatchReceipt(donationId, false);

        return mapToResponse(donation, payment, receipt);
    }

    @Transactional
    public DonationReceipt generateAndDispatchReceipt(Long donationId, boolean forceResend) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation", "id", donationId));

        DonationReceipt receipt = ensureReceiptForDonation(donation);

        if (!forceResend && receipt.isEmailSent()) {
            return receipt;
        }

        byte[] receiptPdf = receiptService.generateReceiptPdf(receipt.getReceiptNumber());
        emailService.sendReceiptPdfToStakeholders(donation, receipt, receiptPdf);

        receipt.setEmailSent(true);
        receiptRepository.save(receipt);
        donation.setReceipt(receipt);
        donationRepository.save(donation);

        return receipt;
    }

    @Transactional
    public void markPhysicalDonationCompleted(Long donationId) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation", "id", donationId));

        if (isMonetaryDonation(donation) || donation.getDonationStatus() == DonationStatus.COMPLETED) {
            return;
        }

        donation.setDonationStatus(DonationStatus.COMPLETED);
        donationRepository.save(donation);
    }

    @Transactional(readOnly = true)
    public DonationResponse getDonationById(Long donationId) {
        Donation d = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation", "id", donationId));
        return mapToResponse(d, d.getPayment(), d.getReceipt());
    }

    @Transactional(readOnly = true)
    public DonationResponse getDonationByIdForActor(Long donationId, Long actorUserId, UserRole actorRole, String actorEmail) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation", "id", donationId));

        if (actorRole == UserRole.ADMIN) {
            return mapToResponse(donation, donation.getPayment(), donation.getReceipt());
        }

        if (actorRole == UserRole.DONOR) {
            boolean ownsDonation = donation.getUser() != null
                    && donation.getUser().getUserId() != null
                    && donation.getUser().getUserId().equals(actorUserId);
            if (!ownsDonation) {
                throw new AccessDeniedException("You can access only your own donations");
            }
            return mapToResponse(donation, donation.getPayment(), donation.getReceipt());
        }

        if (actorRole == UserRole.NGO) {
            String donationNgoEmail = donation.getCampaign() != null && donation.getCampaign().getNgo() != null
                    ? donation.getCampaign().getNgo().getEmail()
                    : null;
            if (donationNgoEmail == null || actorEmail == null || !donationNgoEmail.equalsIgnoreCase(actorEmail)) {
                throw new AccessDeniedException("You can access only your NGO donations");
            }
            return mapToResponse(donation, donation.getPayment(), donation.getReceipt());
        }

        throw new AccessDeniedException("Access denied");
    }

    private Boolean resolvePaymentConfirmedFilter(String paymentStatus) {
        String normalized = String.valueOf(paymentStatus == null ? "" : paymentStatus).trim().toLowerCase();
        if (normalized.isBlank() || "all".equals(normalized)) return null;
        if ("confirmed".equals(normalized)) return true;
        if ("pending".equals(normalized)) return false;
        throw new BadRequestException("paymentStatus must be one of: pending, confirmed");
    }

    private boolean resolveRequiredPaymentConfirmed(String paymentStatus) {
        Boolean confirmed = resolvePaymentConfirmedFilter(paymentStatus);
        if (confirmed == null) {
            throw new BadRequestException("paymentStatus must be one of: pending, confirmed");
        }
        return confirmed;
    }

    private boolean isMonetaryDonation(Donation donation) {
        return donation.getDonationType() == DonationType.MONEY;
    }

    private void validateDonationRequest(DonationRequestDTO request) {
        if (request.getDonationType() == null) {
            throw new BadRequestException("donationType is required");
        }

        if (request.getAmount() == null) {
            throw new BadRequestException("amount is required");
        }

        if (request.getDonationType() == DonationType.MONEY && request.getAmount().compareTo(java.math.BigDecimal.TEN) < 0) {
            throw new BadRequestException("Minimum monetary donation amount is 10");
        }

        if (request.getDonationType() != DonationType.MONEY && request.getAmount().compareTo(java.math.BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Amount cannot be negative for physical donations");
        }

        if (request.getDonationType() != DonationType.MONEY) {
            String itemType = request.getItemType() == null ? "" : request.getItemType().trim();
            if (itemType.isBlank()) {
                throw new BadRequestException("itemType is required for physical donations");
            }

            Integer itemCount = request.getItemCount();
            if (itemCount == null || itemCount <= 0) {
                throw new BadRequestException("itemCount must be greater than 0 for physical donations");
            }
        }
    }

    private void createDonationItemsForPhysicalDonation(Donation donation, DonationRequestDTO request) {
        String rawItemType = request.getItemType() == null ? "" : request.getItemType();
        List<String> categories = Arrays.stream(rawItemType.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(String::toLowerCase)
                .distinct()
                .collect(Collectors.toList());

        if (categories.isEmpty()) {
            categories = List.of("other");
        }

        int declaredCount = request.getItemCount() == null ? categories.size() : request.getItemCount();
        int quantityPerCategory = Math.max(1, (int) Math.ceil((double) declaredCount / categories.size()));

        List<DonationItem> items = categories.stream()
                .map(category -> DonationItem.builder()
                        .donation(donation)
                        .itemName(category)
                        .category(category)
                        .quantity(quantityPerCategory)
                        .description("Physical donation item")
                        .estimatedValue(BigDecimal.ZERO)
                        .build())
                .collect(Collectors.toList());

        donationItemRepository.saveAll(items);
    }

    private PaymentMethod resolveSupportedPaymentMethod(PaymentMethod paymentMethod) {
        PaymentMethod resolvedMethod = paymentMethod != null ? paymentMethod : PaymentMethod.UPI;
        if (resolvedMethod != PaymentMethod.UPI && resolvedMethod != PaymentMethod.CARD) {
            throw new BadRequestException("Monetary donations support only UPI or CARD payment methods");
        }
        return resolvedMethod;
    }

    private DonationReceipt ensureReceiptForDonation(Donation donation) {
        if (donation.getReceipt() != null) return donation.getReceipt();

        DonationReceipt receipt = DonationReceipt.builder()
                .donation(donation)
                .receiptNumber("REC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .build();

        DonationReceipt savedReceipt = receiptRepository.save(receipt);
        donation.setReceipt(savedReceipt);
        return savedReceipt;
    }

    private String toAdminPaymentStatus(Payment payment) {
        return payment != null && payment.getPaymentStatus() == PaymentStatus.SUCCESS
                ? "confirmed"
                : "pending";
    }

    private DonationResponse mapToResponse(Donation d, Payment p, DonationReceipt r) {
        BlockchainTransaction bt = d.getBlockchainTransaction();
        return DonationResponse.builder()
                .donationId(d.getDonationId())
                .donorName(d.isAnonymous() ? "Anonymous" : d.getUser().getName())
                .donorEmail(d.getUser().getEmail())
                .campaignId(d.getCampaign().getCampaignId())
                .campaignTitle(d.getCampaign().getTitle())
                .ngoName(d.getCampaign().getNgo().getNgoName())
                .donationType(d.getDonationType())
                .amount(d.getAmount())
                .donationStatus(d.getDonationStatus())
                .paymentStatus(toAdminPaymentStatus(p))
                .paymentMethod(p != null ? p.getPaymentMethod() : null)
                .transactionId(p != null ? p.getTransactionId() : null)
                .donationDate(d.getDonationDate())
                .receiptNumber(r != null ? r.getReceiptNumber() : null)
                .message(d.getMessage())
                .anonymous(d.isAnonymous())
                .blockchainTxHash(bt != null ? bt.getTxHash() : null)
                .build();
    }
}
