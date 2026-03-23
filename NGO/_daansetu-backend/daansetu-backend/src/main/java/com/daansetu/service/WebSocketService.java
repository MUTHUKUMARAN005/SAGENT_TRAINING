// src/main/java/com/daansetu/service/WebSocketService.java
package com.daansetu.service;

import com.daansetu.dto.response.DonationResponse;
import com.daansetu.entity.PickupRequest;
import com.daansetu.entity.User;
import com.daansetu.entity.Volunteer;
import com.daansetu.enums.UserRole;
import com.daansetu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
        private final UserRepository userRepository;

    // ============================================
    // LIVE DONATION FEED
    // ============================================
    public void broadcastNewDonation(DonationResponse donation) {
        Map<String, Object> payload = Map.of(
                "type", "NEW_DONATION",
                "donationId", donation.getDonationId(),
                "campaignTitle", donation.getCampaignTitle(),
                "amount", donation.getAmount(),
                "donorName", donation.isAnonymous() ? "Anonymous" : "A generous donor",
                "ngoName", donation.getNgoName(),
                "donationType", donation.getDonationType(),
                "timestamp", LocalDateTime.now()
        );

        messagingTemplate.convertAndSend("/topic/donations", payload);
        log.info("Broadcasted new donation: {} - ₹{}", donation.getDonationId(), donation.getAmount());
    }

    // ============================================
    // CAMPAIGN PROGRESS UPDATE
    // ============================================
    public void broadcastCampaignProgress(Long campaignId, String campaignTitle,
                                          BigDecimal collectedAmount, BigDecimal targetAmount,
                                          int donorsCount) {
        double percentage = targetAmount.doubleValue() > 0
                ? (collectedAmount.doubleValue() / targetAmount.doubleValue()) * 100 : 0;

        Map<String, Object> payload = Map.of(
                "type", "CAMPAIGN_PROGRESS",
                "campaignId", campaignId,
                "campaignTitle", campaignTitle,
                "collectedAmount", collectedAmount,
                "targetAmount", targetAmount,
                "donorsCount", donorsCount,
                "percentageFunded", Math.min(percentage, 100),
                "timestamp", LocalDateTime.now()
        );

        messagingTemplate.convertAndSend("/topic/campaigns/" + campaignId, payload);
        messagingTemplate.convertAndSend("/topic/campaigns", payload);
        log.info("Broadcasted campaign progress: {} - {:.1f}%", campaignTitle, percentage);
    }

    // ============================================
    // VOLUNTEER TASK NOTIFICATION
    // ============================================
    public void notifyVolunteerTask(Long userId, Map<String, Object> taskData) {
        Map<String, Object> payload = Map.of(
                "type", "TASK_ASSIGNED",
                "data", taskData,
                "timestamp", LocalDateTime.now()
        );

        messagingTemplate.convertAndSendToUser(
                userId.toString(), "/queue/tasks", payload
        );
        log.info("Sent task notification to user: {}", userId);
    }

    // ============================================
    // NOTIFICATION BELL UPDATE
    // ============================================
    public void sendNotification(Long userId, String title, String message,
                                 String type, Long referenceId) {
        Map<String, Object> payload = Map.of(
                "type", "NOTIFICATION",
                "title", title,
                "message", message,
                "notificationType", type,
                "referenceId", referenceId != null ? referenceId : 0,
                "timestamp", LocalDateTime.now()
        );

        messagingTemplate.convertAndSendToUser(
                userId.toString(), "/queue/notifications", payload
        );
        log.info("Sent notification to user {}: {}", userId, title);
    }

    // ============================================
    // BROADCAST PLATFORM STATS
    // ============================================
    public void broadcastPlatformStats(Map<String, Object> stats) {
        messagingTemplate.convertAndSend("/topic/stats", stats);
    }

    public void broadcastPickupLiveLocation(PickupRequest pickup, Volunteer volunteer) {
        if (pickup == null || pickup.getPickupId() == null) {
            return;
        }

        Long pickupId = pickup.getPickupId();
        User volunteerUser = volunteer != null ? volunteer.getUser() : null;
        String volunteerName = volunteerUser != null && volunteerUser.getName() != null
                ? volunteerUser.getName()
                : "Volunteer";

        Map<String, Object> payload = Map.of(
                "type", "PICKUP_LOCATION",
                "pickupId", pickupId,
                "volunteerId", volunteer != null ? volunteer.getVolunteerId() : 0L,
                "volunteerName", volunteerName,
                "latitude", pickup.getVolunteerLatitude(),
                "longitude", pickup.getVolunteerLongitude(),
                "otpVerified", pickup.isOtpVerified(),
                "updatedAt", pickup.getVolunteerLocationUpdatedAt() != null
                        ? pickup.getVolunteerLocationUpdatedAt()
                        : LocalDateTime.now()
        );

        messagingTemplate.convertAndSend("/topic/pickups/" + pickupId + "/location", payload);
        messagingTemplate.convertAndSend("/topic/pickups/location", payload);

        if (pickup.getDonation() != null && pickup.getDonation().getUser() != null && pickup.getDonation().getUser().getUserId() != null) {
            messagingTemplate.convertAndSendToUser(
                    pickup.getDonation().getUser().getUserId().toString(),
                    "/queue/pickups/location",
                    payload
            );
        }

        String ngoEmail = pickup.getDonation() != null
                && pickup.getDonation().getCampaign() != null
                && pickup.getDonation().getCampaign().getNgo() != null
                ? pickup.getDonation().getCampaign().getNgo().getEmail()
                : null;

        if (ngoEmail != null && !ngoEmail.isBlank()) {
            userRepository.findByEmailIgnoreCase(ngoEmail.trim()).ifPresent(ngoUser ->
                    messagingTemplate.convertAndSendToUser(
                            ngoUser.getUserId().toString(),
                            "/queue/pickups/location",
                            payload
                    )
            );
        }

        userRepository.findByRole(UserRole.ADMIN, org.springframework.data.domain.Pageable.unpaged())
                .forEach(admin -> messagingTemplate.convertAndSendToUser(
                        admin.getUserId().toString(),
                        "/queue/pickups/location",
                        payload
                ));

        log.debug("Broadcasted live pickup location for pickup {}", pickupId);
    }
}