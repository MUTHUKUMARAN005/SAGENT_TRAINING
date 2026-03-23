package com.daansetu.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminDonationPaymentStatusRequest {
    @NotBlank
    private String paymentStatus;
}
