// src/main/java/com/daansetu/dto/response/CampaignResponse.java
package com.daansetu.dto.response;

import com.daansetu.enums.CampaignStatus;
import com.daansetu.enums.DonationType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CampaignResponse {
    private Long campaignId;
    private String title;
    private String description;
    private DonationType donationType;
    private BigDecimal targetAmount;
    private BigDecimal collectedAmount;
    private LocalDate startDate;
    private LocalDate endDate;
    private CampaignStatus campaignStatus;
    private String image;
    private String city;
    private String state;
    private Double latitude;
    private Double longitude;
    private Integer donorsCount;
    private String ngoName;
    private Long ngoId;
    private String ngoAddress;
    private Double ngoLatitude;
    private Double ngoLongitude;
    private Double percentageFunded;
    private Long daysLeft;
}