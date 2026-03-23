// src/main/java/com/daansetu/service/DashboardService.java
package com.daansetu.service;

import com.daansetu.dto.response.DashboardStatsResponse;
import com.daansetu.entity.Campaign;
import com.daansetu.enums.CampaignStatus;
import com.daansetu.enums.TaskStatus;
import com.daansetu.enums.UserRole;
import com.daansetu.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DonationRepository donationRepository;
    private final CampaignRepository campaignRepository;
    private final NGORepository ngoRepository;
    private final UserRepository userRepository;
    private final VolunteerRepository volunteerRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;

    public DashboardStatsResponse getAdminStats() {
        return DashboardStatsResponse.builder()
                .totalDonations(donationRepository.getTotalDonations())
                .activeCampaigns(campaignRepository.countByCampaignStatus(CampaignStatus.ACTIVE))
                .registeredNGOs(ngoRepository.countByVerifiedTrue())
                .totalUsers(userRepository.count())
                .totalDonors(userRepository.countByRole(UserRole.DONOR))
                .totalVolunteers(userRepository.countByRole(UserRole.VOLUNTEER))
                .monthlyDonations(donationRepository.getTotalDonationsSince(
                        LocalDateTime.now().minusDays(30)))
                .childrenEducated(5200L)
                .mealsServed(32000L)
                .build();
    }

    public Map<String, Object> getNGOStats(Long ngoUserId, String ngoEmail) {
        Map<String, Object> stats = new LinkedHashMap<>();
        var campaigns = campaignRepository.findAllByNgoAccessContext(ngoUserId, ngoEmail);
        String ngoUserName = userRepository.findById(ngoUserId)
                .map(com.daansetu.entity.User::getName)
                .map(String::trim)
                .orElse("");
        var ngoOpt = ngoRepository.findByEmailIgnoreCase(ngoEmail);
        Optional<com.daansetu.entity.NGO> ngoByNameOpt = !ngoUserName.isEmpty()
            ? ngoRepository.findByNgoNameIgnoreCase(ngoUserName).stream().findFirst()
            : Optional.empty();

        if ((campaigns == null || campaigns.isEmpty()) && ngoByNameOpt.isPresent()) {
            campaigns = ngoByNameOpt.get().getCampaigns();
            ngoOpt = ngoByNameOpt;
        }

        if (campaigns.isEmpty() && ngoOpt.isPresent()) {
            campaigns.addAll(ngoOpt.get().getCampaigns());
        }

        long activeCampaigns = campaigns.stream()
                .filter(c -> c.getCampaignStatus() == CampaignStatus.ACTIVE)
                .count();
        BigDecimal totalRaised = campaigns.stream()
                .map(c -> c.getCollectedAmount() != null ? c.getCollectedAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int totalDonors = campaigns.stream()
                .mapToInt(c -> c.getDonorsCount() != null ? c.getDonorsCount() : 0)
                .sum();

        BigDecimal donationRaised = donationRepository.sumCompletedAmountByNgoAccessContext(ngoUserId, ngoEmail);
        long distinctDonors = donationRepository.countDistinctDonorsByNgoAccessContext(ngoUserId, ngoEmail);

        if (ngoOpt.isPresent() && (donationRaised == null || donationRaised.compareTo(BigDecimal.ZERO) <= 0)) {
            donationRaised = donationRepository.sumCompletedAmountByNgoId(ngoOpt.get().getNgoId());
        }
        if (ngoOpt.isPresent() && distinctDonors <= 0) {
            distinctDonors = donationRepository.countDistinctDonorsByNgoId(ngoOpt.get().getNgoId());
        }

        if ((totalRaised == null || totalRaised.compareTo(BigDecimal.ZERO) <= 0) && donationRaised != null) {
            totalRaised = donationRaised;
        }
        if (totalDonors <= 0 && distinctDonors > 0) {
            totalDonors = Math.toIntExact(distinctDonors);
        }

        stats.put("active_campaigns", activeCampaigns);
        stats.put("total_campaigns", (long) campaigns.size());
        stats.put("total_raised", totalRaised);
        stats.put("total_donors", totalDonors);

        if (ngoOpt.isPresent()) {
            var ngo = ngoOpt.get();
            stats.put("ngo_id", ngo.getNgoId());
            stats.put("ngo_name", ngo.getNgoName());
            stats.put("verified", ngo.isVerified());
        }

        if (!stats.containsKey("ngo_name") && !campaigns.isEmpty()) {
            Campaign first = campaigns.get(0);
            if (first.getNgo() != null) {
                stats.put("ngo_id", first.getNgo().getNgoId());
                stats.put("ngo_name", first.getNgo().getNgoName());
                stats.put("verified", first.getNgo().isVerified());
            }
        }

        return stats;
    }

    public Map<String, Object> getVolunteerStats(Long userId) {
        Map<String, Object> stats = new LinkedHashMap<>();
        volunteerRepository.findByUserUserId(userId).ifPresent(v -> {
            var volunteerTasks = taskAssignmentRepository.findByVolunteerVolunteerId(v.getVolunteerId());

            long completedTasks = volunteerTasks.stream()
                    .filter(task -> task.getTaskStatus() == TaskStatus.COMPLETED)
                    .count();
            long pendingTasks = volunteerTasks.stream()
                    .filter(task -> task.getTaskStatus() == TaskStatus.ASSIGNED || task.getTaskStatus() == TaskStatus.IN_PROGRESS)
                    .count();
            long totalTasks = volunteerTasks.stream()
                    .filter(task -> task.getTaskStatus() != TaskStatus.CANCELLED)
                    .count();

            stats.put("volunteer_id", v.getVolunteerId());
            stats.put("hours_volunteered", v.getHoursVolunteered());
            stats.put("tasks_completed", completedTasks);
            stats.put("pending_tasks", pendingTasks);
            stats.put("total_tasks", totalTasks);
            stats.put("status", v.getVolunteerStatus().name());
            stats.put("joined_date", v.getJoinedDate() != null ? v.getJoinedDate().toString() : null);
        });
        if (stats.isEmpty()) {
            stats.put("hours_volunteered", 0);
            stats.put("tasks_completed", 0L);
            stats.put("pending_tasks", 0L);
            stats.put("total_tasks", 0L);
            stats.put("status", "NOT_REGISTERED");
        }
        return stats;
    }

    public Map<String, Object> getDonorStats(Long userId) {
        BigDecimal totalDonated = donationRepository.getTotalDonationsByUser(userId);
        long campaignsSupported = donationRepository.countCampaignsByUser(userId);
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total_donated", totalDonated != null ? totalDonated : BigDecimal.ZERO);
        stats.put("campaigns_supported", campaignsSupported);
        return stats;
    }
}
