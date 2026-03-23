package com.daansetu.dto.request;

import com.daansetu.enums.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRequest {

    @NotNull
    private Long donationId;

    @NotNull
    private PaymentMethod paymentMethod;

    private String transactionId;

    @NotNull
    @DecimalMin("10")
    private BigDecimal amount;

    private String screenshotUrl;
    private String upiId;
    private String cardLastFour;
    private String bankName;
    private String gatewayOrderId;
}