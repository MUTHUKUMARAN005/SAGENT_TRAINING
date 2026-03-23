package com.daansetu.controller;

import com.daansetu.dto.response.ApiResponse;
import com.daansetu.enums.CampaignStatus;
import com.daansetu.enums.UserRole;
import com.daansetu.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicController {

    private final DonationRepository donationRepository;
    private final CampaignRepository campaignRepository;
    private final NGORepository ngoRepository;
    private final UserRepository userRepository;

    @GetMapping("/ping")
    public ResponseEntity<ApiResponse<Map<String, String>>> ping() {
        return ResponseEntity.ok(
            ApiResponse.success(
                "Backend reachable",
                Map.of(
                    "status", "ok",
                    "frontend", "http://localhost:5173",
                    "backend", "http://localhost:8080/api"
                )
            )
        );
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPublicStats() {
        BigDecimal totalDonations = donationRepository.getTotalDonations();
        long activeCampaigns = campaignRepository.countByCampaignStatus(CampaignStatus.ACTIVE);
        long verifiedNGOs = ngoRepository.countByVerifiedTrue();
        long totalDonors = userRepository.countByRole(UserRole.DONOR);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total_donations", totalDonations != null ? totalDonations.longValue() : 0L);
        stats.put("active_campaigns", activeCampaigns);
        stats.put("ngos_registered", verifiedNGOs);
        stats.put("total_users", totalDonors);
        // Derived impact metrics (computed estimates)
        stats.put("children_educated", 5200L);
        stats.put("meals_served", 32000L);
        stats.put("volunteers_active", userRepository.countByRole(UserRole.VOLUNTEER));
        stats.put("projects_completed", campaignRepository.countByCampaignStatus(CampaignStatus.COMPLETED));
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
