// src/main/java/com/daansetu/dto/response/DashboardStatsResponse.java
package com.daansetu.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardStatsResponse {
    private BigDecimal totalDonations;
    private Long activeCampaigns;
    private Long registeredNGOs;
    private Long totalUsers;
    private Long totalDonors;
    private Long totalVolunteers;
    private Long completedProjects;
    private BigDecimal monthlyDonations;
    private Long childrenEducated;
    private Long mealsServed;
}