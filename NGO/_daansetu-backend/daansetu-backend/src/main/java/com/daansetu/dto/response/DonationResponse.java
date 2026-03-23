// src/main/java/com/daansetu/dto/response/DonationResponse.java
package com.daansetu.dto.response;

import com.daansetu.enums.DonationStatus;
import com.daansetu.enums.DonationType;
import com.daansetu.enums.PaymentMethod;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DonationResponse {
    private Long donationId;
    private String donorName;
    private String donorEmail;
    private Long campaignId;
    private String campaignTitle;
    private String ngoName;
    private DonationType donationType;
    private BigDecimal amount;
    private DonationStatus donationStatus;
    private String paymentStatus;
    private PaymentMethod paymentMethod;
    private String transactionId;
    private LocalDateTime donationDate;
    private String receiptNumber;
    private String message;
    private boolean anonymous;
    private String blockchainTxHash;
}
