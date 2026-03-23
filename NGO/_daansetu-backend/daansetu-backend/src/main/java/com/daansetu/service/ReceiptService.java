package com.daansetu.service;

import com.daansetu.dto.response.ReceiptResponse;
import com.daansetu.entity.Donation;
import com.daansetu.entity.DonationReceipt;
import com.daansetu.entity.Payment;
import com.daansetu.entity.User;
import com.daansetu.enums.UserRole;
import com.daansetu.exception.UnauthorizedException;
import com.daansetu.exception.ResourceNotFoundException;
import com.daansetu.repository.DonationReceiptRepository;
import com.daansetu.repository.DonationRepository;
import com.daansetu.util.ReceiptPdfGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReceiptService {

    private final DonationReceiptRepository receiptRepository;
    private final DonationRepository donationRepository;
    private final ReceiptPdfGenerator pdfGenerator;

    @Value("${app.backend-url}")
    private String backendUrl;

    public ReceiptResponse getReceiptByNumber(String receiptNumber) {
        DonationReceipt receipt = receiptRepository.findByReceiptNumber(receiptNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt", "number", receiptNumber));
        return mapToResponse(receipt);
    }

    public ReceiptResponse getReceiptByNumberForUser(String receiptNumber, Long userId) {
        return getReceiptByNumberForActor(receiptNumber, userId, UserRole.DONOR, null);
    }

    public ReceiptResponse getReceiptByNumberForActor(
            String receiptNumber,
            Long actorUserId,
            UserRole actorRole,
            String actorEmail
    ) {
        DonationReceipt receipt = receiptRepository.findByReceiptNumber(receiptNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt", "number", receiptNumber));

        validateReceiptAccess(receipt, actorUserId, actorRole, actorEmail);
        return mapToResponse(receipt);
    }

    public ReceiptResponse getReceiptByDonationId(Long donationId) {
        DonationReceipt receipt = receiptRepository.findByDonationDonationId(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt", "donationId", donationId));
        return mapToResponse(receipt);
    }

    public List<ReceiptResponse> getReceiptsByUser(Long userId) {
        List<Donation> donations = donationRepository
                .findByUserUserIdAndDonationStatus(userId,
                        com.daansetu.enums.DonationStatus.COMPLETED);

        return donations.stream()
                .filter(d -> d.getReceipt() != null)
                .map(d -> mapToResponse(d.getReceipt()))
                .collect(Collectors.toList());
    }

    public byte[] generateReceiptPdf(String receiptNumber) {
        DonationReceipt receipt = receiptRepository.findByReceiptNumber(receiptNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt", "number", receiptNumber));

        Donation donation = receipt.getDonation();
        User user = donation.getUser();
        Payment payment = donation.getPayment();

        return pdfGenerator.generateReceipt(
                receiptNumber,
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getPanNumber(),
                donation.getAmount(),
                donation.getCampaign().getTitle(),
                donation.getCampaign().getNgo().getNgoName(),
                donation.getDonationType().name(),
                payment != null ? payment.getPaymentMethod().name() : "N/A",
                payment != null ? payment.getTransactionId() : "N/A",
                donation.getDonationDate()
        );
    }

    public byte[] generateReceiptPdfForUser(String receiptNumber, Long userId) {
        return generateReceiptPdfForActor(receiptNumber, userId, UserRole.DONOR, null);
    }

    public byte[] generateReceiptPdfForActor(
            String receiptNumber,
            Long actorUserId,
            UserRole actorRole,
            String actorEmail
    ) {
        DonationReceipt receipt = receiptRepository.findByReceiptNumber(receiptNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt", "number", receiptNumber));

        validateReceiptAccess(receipt, actorUserId, actorRole, actorEmail);
        return generateReceiptPdf(receiptNumber);
    }

    public ReceiptResponse verifyReceipt(String receiptNumber) {
        DonationReceipt receipt = receiptRepository.findByReceiptNumber(receiptNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt", "number", receiptNumber));
        return mapToResponse(receipt);
    }

    private void validateReceiptAccess(
            DonationReceipt receipt,
            Long actorUserId,
            UserRole actorRole,
            String actorEmail
    ) {
        if (actorRole == null) {
            throw new UnauthorizedException("You are not allowed to access this receipt");
        }

        if (actorRole == UserRole.ADMIN) {
            return;
        }

        Donation donation = receipt.getDonation();
        if (donation == null) {
            throw new UnauthorizedException("You are not allowed to access this receipt");
        }

        if (actorRole == UserRole.DONOR) {
            Long donorUserId = donation.getUser() != null ? donation.getUser().getUserId() : null;
            if (donorUserId != null && donorUserId.equals(actorUserId)) {
                return;
            }
            throw new UnauthorizedException("You are not allowed to access this receipt");
        }

        if (actorRole == UserRole.NGO) {
            String donationNgoEmail =
                    donation.getCampaign() != null && donation.getCampaign().getNgo() != null
                            ? donation.getCampaign().getNgo().getEmail()
                            : null;

            if (donationNgoEmail != null
                    && actorEmail != null
                    && donationNgoEmail.equalsIgnoreCase(actorEmail)) {
                return;
            }
            throw new UnauthorizedException("You are not allowed to access this receipt");
        }

        throw new UnauthorizedException("You are not allowed to access this receipt");
    }

    private ReceiptResponse mapToResponse(DonationReceipt receipt) {
        Donation donation = receipt.getDonation();
        User user = donation.getUser();
        Payment payment = donation.getPayment();

        return ReceiptResponse.builder()
                .receiptId(receipt.getReceiptId())
                .receiptNumber(receipt.getReceiptNumber())
                .issuedDate(receipt.getIssuedDate())
                .donorName(donation.isAnonymous() ? "Anonymous" : user.getName())
                .donorEmail(user.getEmail())
                .donorPhone(user.getPhone())
                .donorPan(user.getPanNumber())
                .amount(donation.getAmount())
                .campaignTitle(donation.getCampaign().getTitle())
                .ngoName(donation.getCampaign().getNgo().getNgoName())
                .donationType(donation.getDonationType().name())
                .paymentMethod(payment != null ? payment.getPaymentMethod().name() : null)
                .transactionId(payment != null ? payment.getTransactionId() : null)
                .pdfUrl(backendUrl + "/receipts/" + receipt.getReceiptNumber() + "/pdf")
                .verificationUrl(backendUrl + "/receipts/verify/" + receipt.getReceiptNumber())
                .section80gEligible(true)
                .build();
    }
}
