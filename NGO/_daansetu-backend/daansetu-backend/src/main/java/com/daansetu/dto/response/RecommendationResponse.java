// src/main/java/com/daansetu/dto/response/RecommendationResponse.java
package com.daansetu.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {
    private Long campaignId;
    private String title;
    private String description;
    private String image;
    private String ngoName;
    private Long ngoId;
    private String city;
    private String donationType;
    private BigDecimal targetAmount;
    private BigDecimal collectedAmount;
    private Integer donorsCount;
    private Double percentageFunded;
    private Long daysLeft;
    private LocalDate endDate;

    /** Computed by recommendation engine */
    private int score;            // 0-100 relevance score
    private String matchLabel;    // e.g. "Education Match", "Trending", "Urgent"
    private String matchReason;   // human-readable explanation
}

