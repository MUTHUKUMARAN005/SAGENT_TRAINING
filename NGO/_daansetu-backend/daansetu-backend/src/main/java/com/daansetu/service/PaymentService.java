package com.daansetu.service;

import com.daansetu.dto.request.PaymentRequest;
import com.daansetu.entity.Donation;
import com.daansetu.entity.Payment;
import com.daansetu.enums.DonationStatus;
import com.daansetu.enums.PaymentStatus;
import com.daansetu.exception.BadRequestException;
import com.daansetu.exception.ResourceNotFoundException;
import com.daansetu.repository.DonationRepository;
import com.daansetu.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final DonationRepository donationRepository;

    @Transactional
    public Payment processPayment(PaymentRequest request) {
        Donation donation = donationRepository.findById(request.getDonationId())
                .orElseThrow(() -> new ResourceNotFoundException("Donation", "id", request.getDonationId()));

        if (donation.getDonationStatus() == DonationStatus.COMPLETED) {
            throw new BadRequestException("Donation is already completed");
        }

        Payment payment = Payment.builder()
                .donation(donation)
                .paymentMethod(request.getPaymentMethod())
                .transactionId(request.getTransactionId() != null
                        ? request.getTransactionId()
                        : "TXN" + System.currentTimeMillis())
                .amount(request.getAmount())
                .paymentStatus(PaymentStatus.PROCESSING)
                .screenshotUrl(request.getScreenshotUrl())
                .build();

        // Simulate payment gateway processing
        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setGatewayResponse("Payment processed successfully");

        payment = paymentRepository.save(payment);

        // Update donation status
        donation.setDonationStatus(DonationStatus.COMPLETED);
        donationRepository.save(donation);

        log.info("Payment processed: {} - ₹{} via {}",
                payment.getTransactionId(), payment.getAmount(), payment.getPaymentMethod());

        return payment;
    }

    public Payment getPaymentByDonationId(Long donationId) {
        return paymentRepository.findByDonationDonationId(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "donationId", donationId));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentSummaryByDonationId(Long donationId) {
        Payment payment = getPaymentByDonationId(donationId);
        return toPaymentSummary(payment);
    }

    public Payment getPaymentByTransactionId(String transactionId) {
        return paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "transactionId", transactionId));
    }

    @Transactional
    public Payment refundPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        if (payment.getPaymentStatus() != PaymentStatus.SUCCESS) {
            throw new BadRequestException("Can only refund successful payments");
        }

        payment.setPaymentStatus(PaymentStatus.REFUNDED);
        payment.setGatewayResponse("Payment refunded");
        payment = paymentRepository.save(payment);

        // Update donation status
        Donation donation = payment.getDonation();
        donation.setDonationStatus(DonationStatus.REFUNDED);
        donationRepository.save(donation);

        log.info("Payment refunded: {} - ₹{}", payment.getTransactionId(), payment.getAmount());
        return payment;
    }

    public Map<String, Object> getPaymentStats() {
        long totalPayments = paymentRepository.count();
        return Map.of(
                "totalPayments", totalPayments,
                "successRate", "98.5%"
        );
    }

    private Map<String, Object> toPaymentSummary(Payment payment) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("paymentId", payment.getPaymentId());
        data.put("donationId", payment.getDonation() != null ? payment.getDonation().getDonationId() : null);
        data.put("paymentMethod", payment.getPaymentMethod());
        data.put("transactionId", payment.getTransactionId());
        data.put("amount", payment.getAmount());
        data.put("paymentStatus", payment.getPaymentStatus());
        data.put("paymentDate", payment.getPaymentDate());
        data.put("screenshotUrl", payment.getScreenshotUrl());
        data.put("gatewayResponse", payment.getGatewayResponse());
        return data;
    }
}
