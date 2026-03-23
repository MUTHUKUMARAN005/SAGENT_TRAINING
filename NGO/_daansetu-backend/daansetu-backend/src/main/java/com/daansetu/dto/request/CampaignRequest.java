// src/main/java/com/daansetu/dto/request/CampaignRequest.java
package com.daansetu.dto.request;

import com.daansetu.enums.DonationType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CampaignRequest {
    @NotBlank
    private String title;
    private String description;
    private Long ngoId;
    private DonationType donationType;
    @NotNull @DecimalMin("100")
    private BigDecimal targetAmount;
    private LocalDate startDate;
    private LocalDate endDate;
    private String image;
    private String city;
    private String state;
}
