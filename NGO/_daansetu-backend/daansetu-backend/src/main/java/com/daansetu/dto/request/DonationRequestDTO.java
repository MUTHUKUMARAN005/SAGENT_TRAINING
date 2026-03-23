// src/main/java/com/daansetu/dto/request/DonationRequestDTO.java
package com.daansetu.dto.request;

import com.daansetu.enums.DonationType;
import com.daansetu.enums.PaymentMethod;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DonationRequestDTO {
    @NotNull
    private Long campaignId;
    @NotNull
    private DonationType donationType;
    @NotNull @DecimalMin("0")
    private BigDecimal amount;
    private String itemType;
    private Integer itemCount;
    private PaymentMethod paymentMethod;
    private String transactionId;
    private String message;
    private boolean anonymous;
    private String panNumber;
}