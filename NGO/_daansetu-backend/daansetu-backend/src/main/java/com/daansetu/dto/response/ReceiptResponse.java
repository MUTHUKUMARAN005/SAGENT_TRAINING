// src/main/java/com/daansetu/dto/response/ReceiptResponse.java
package com.daansetu.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReceiptResponse {
    private Long receiptId;
    private String receiptNumber;
    private LocalDateTime issuedDate;
    private String donorName;
    private String donorEmail;
    private String donorPhone;
    private String donorPan;
    private BigDecimal amount;
    private String campaignTitle;
    private String ngoName;
    private String donationType;
    private String paymentMethod;
    private String transactionId;
    private String pdfUrl;
    private String certificateUrl;
    private String verificationUrl;
    private boolean section80gEligible;
}