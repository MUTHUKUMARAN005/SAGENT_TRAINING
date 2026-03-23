// src/main/java/com/daansetu/service/RecommendationService.java
package com.daansetu.service;

import com.daansetu.dto.response.RecommendationResponse;
import com.daansetu.entity.Campaign;
import com.daansetu.entity.Donation;
import com.daansetu.entity.User;
import com.daansetu.enums.CampaignStatus;
import com.daansetu.enums.DonationStatus;
import com.daansetu.repository.CampaignRepository;
import com.daansetu.repository.DonationRepository;
import com.daansetu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final DonationRepository donationRepository;
    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;

    // Maximum recommendations to return
    private static final int MAX_RESULTS = 6;

    @Transactional(readOnly = true)
    public List<RecommendationResponse> getRecommendations(Long userId) {

        // ── 1. Fetch user's completed donation history ──────────────────────────
        List<Donation> history = donationRepository
                .findByUserUserIdAndDonationStatus(userId, DonationStatus.COMPLETED);

        // ── 2. Build preference profile ─────────────────────────────────────────
        // Donation types the user has contributed to (e.g., MONEY, FOOD, MEDICINE)
        Map<String, Long> typeFrequency = history.stream()
                .filter(d -> d.getDonationType() != null)
                .collect(Collectors.groupingBy(
                        d -> d.getDonationType().name(),
                        Collectors.counting()
                ));

        // NGO IDs the user has donated to
        Set<Long> donatedNgoIds = history.stream()
                .map(d -> d.getCampaign().getNgo().getNgoId())
                .collect(Collectors.toSet());

        // Campaign IDs already donated to — exclude from results
        Set<Long> donatedCampaignIds = history.stream()
                .map(d -> d.getCampaign().getCampaignId())
                .collect(Collectors.toSet());

        // User's city for geo-relevance
        User user = userRepository.findById(userId).orElse(null);
        String userCity = (user != null && user.getCity() != null)
                ? user.getCity().toLowerCase() : "";

        // ── 3. Load all active campaigns ────────────────────────────────────────
        List<Campaign> activeCampaigns = campaignRepository
                .findByCampaignStatus(CampaignStatus.ACTIVE,
                        org.springframework.data.domain.PageRequest.of(0, 200))
                .getContent();

        // ── 4. Score each campaign ──────────────────────────────────────────────
        List<ScoredCampaign> scored = new ArrayList<>();

        for (Campaign c : activeCampaigns) {
            // Skip already-donated campaigns
            if (donatedCampaignIds.contains(c.getCampaignId())) continue;

            int score = 0;
            List<String> reasons = new ArrayList<>();

            // Donation-type match (+30 per type match, weighted by frequency)
            String campaignType = c.getDonationType() != null ? c.getDonationType().name() : "";
            if (!campaignType.isEmpty() && typeFrequency.containsKey(campaignType)) {
                long freq = typeFrequency.get(campaignType);
                int typeScore = (int) Math.min(30 + (freq - 1) * 5, 45);
                score += typeScore;
                reasons.add("Based on your " + toReadable(campaignType) + " donations");
            }

            // Same NGO the user has donated to before (+20)
            if (donatedNgoIds.contains(c.getNgo().getNgoId())) {
                score += 20;
                reasons.add("You've supported " + c.getNgo().getNgoName() + " before");
            }

            // Trending campaigns — high donors count (+15)
            int donorsCount = c.getDonorsCount() != null ? c.getDonorsCount() : 0;
            if (donorsCount > 50) {
                score += 15;
                if (reasons.isEmpty()) reasons.add("Trending campaign");
            } else if (donorsCount > 20) {
                score += 8;
                if (reasons.isEmpty()) reasons.add("Popular campaign");
            }

            // Urgency — ending within 30 days (+10)
            long daysLeft = c.getEndDate() != null
                    ? ChronoUnit.DAYS.between(LocalDate.now(), c.getEndDate()) : Long.MAX_VALUE;
            if (daysLeft > 0 && daysLeft <= 30) {
                score += 10;
                reasons.add("Ends in " + daysLeft + " day" + (daysLeft == 1 ? "" : "s"));
            }

            // City match (+5)
            if (!userCity.isEmpty() && c.getCity() != null
                    && c.getCity().toLowerCase().contains(userCity)) {
                score += 5;
                if (reasons.isEmpty()) reasons.add("Near you in " + c.getCity());
            }

            // New / no history users: recommend high-performing campaigns
            if (history.isEmpty()) {
                BigDecimal target = c.getTargetAmount() != null ? c.getTargetAmount() : BigDecimal.ONE;
                BigDecimal collected = c.getCollectedAmount() != null ? c.getCollectedAmount() : BigDecimal.ZERO;
                double pct = target.doubleValue() > 0
                        ? collected.doubleValue() / target.doubleValue() * 100 : 0;
                if (pct >= 50) {
                    score += 20;
                    reasons.add("Half-way funded — your donation doubles impact");
                } else if (donorsCount > 10) {
                    score += 15;
                    reasons.add("Community favourite");
                } else {
                    score += 5;
                    reasons.add("Be the first to make a difference");
                }
            }

            // Always add something if no reason yet
            if (reasons.isEmpty()) reasons.add("Discover new causes");

            scored.add(new ScoredCampaign(c, score, reasons));
        }

        // ── 5. Sort by score desc, limit, map to response ──────────────────────
        return scored.stream()
                .sorted(Comparator.comparingInt(ScoredCampaign::score).reversed())
                .limit(MAX_RESULTS)
                .map(sc -> toResponse(sc.campaign(), sc.score(), sc.reasons()))
                .collect(Collectors.toList());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String toReadable(String type) {
        return switch (type.toUpperCase()) {
            case "MONEY" -> "monetary";
            case "FOOD" -> "food";
            case "CLOTHES" -> "clothing";
            case "MEDICINE" -> "medicine";
            case "BOOKS" -> "book";
            default -> type.toLowerCase();
        };
    }

    private String matchLabel(List<String> reasons, int score) {
        String primary = reasons.isEmpty() ? "" : reasons.get(0).toLowerCase();
        if (primary.contains("education") || primary.contains("book")) return "📚 Education Match";
        if (primary.contains("food")) return "🍲 Food Match";
        if (primary.contains("health") || primary.contains("medicine")) return "🏥 Health Match";
        if (primary.contains("clothes") || primary.contains("clothing")) return "👕 Clothing Match";
        if (primary.contains("trending")) return "🔥 Trending";
        if (primary.contains("popular")) return "⭐ Popular";
        if (primary.contains("ends in")) return "⚡ Urgent";
        if (primary.contains("near you")) return "📍 Near You";
        if (primary.contains("supported")) return "🤝 NGO Match";
        if (primary.contains("monetary")) return "💰 Monetary Match";
        if (score >= 40) return "✨ Top Pick";
        return "🌟 Recommended";
    }

    private RecommendationResponse toResponse(Campaign c, int rawScore, List<String> reasons) {
        BigDecimal target = c.getTargetAmount() != null ? c.getTargetAmount() : BigDecimal.ZERO;
        BigDecimal collected = c.getCollectedAmount() != null ? c.getCollectedAmount() : BigDecimal.ZERO;
        double pct = target.doubleValue() > 0
                ? Math.min(collected.doubleValue() / target.doubleValue() * 100, 100) : 0;
        long daysLeft = c.getEndDate() != null
                ? Math.max(ChronoUnit.DAYS.between(LocalDate.now(), c.getEndDate()), 0) : 0;

        // Normalize score to 0–100
        int normalised = Math.min(rawScore * 100 / 80, 100);

        return RecommendationResponse.builder()
                .campaignId(c.getCampaignId())
                .title(c.getTitle())
                .description(c.getDescription())
                .image(c.getImage())
                .ngoName(c.getNgo() != null ? c.getNgo().getNgoName() : "")
                .ngoId(c.getNgo() != null ? c.getNgo().getNgoId() : null)
                .city(c.getCity())
                .donationType(c.getDonationType() != null ? c.getDonationType().name().toLowerCase() : "money")
                .targetAmount(target)
                .collectedAmount(collected)
                .donorsCount(c.getDonorsCount() != null ? c.getDonorsCount() : 0)
                .percentageFunded(pct)
                .daysLeft(daysLeft)
                .endDate(c.getEndDate())
                .score(normalised)
                .matchLabel(matchLabel(reasons, normalised))
                .matchReason(reasons.isEmpty() ? "Discover new causes" : reasons.get(0))
                .build();
    }

    // ── Internal record ───────────────────────────────────────────────────────
    private record ScoredCampaign(Campaign campaign, int score, List<String> reasons) {}
}

