package com.daansetu.service;

import com.daansetu.dto.request.NgoNotificationRequest;
import com.daansetu.entity.Campaign;
import com.daansetu.entity.Notification;
import com.daansetu.entity.PickupRequest;
import com.daansetu.entity.User;
import com.daansetu.entity.Volunteer;
import com.daansetu.enums.VolunteerStatus;
import com.daansetu.exception.BadRequestException;
import com.daansetu.exception.ResourceNotFoundException;
import com.daansetu.repository.CampaignRepository;
import com.daansetu.repository.DonationRepository;
import com.daansetu.repository.NotificationRepository;
import com.daansetu.repository.PickupRequestRepository;
import com.daansetu.repository.TaskAssignmentRepository;
import com.daansetu.repository.UserRepository;
import com.daansetu.repository.VolunteerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final DonationRepository donationRepository;
    private final VolunteerRepository volunteerRepository;
    private final CampaignRepository campaignRepository;
    private final PickupRequestRepository pickupRequestRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final EmailService emailService;
    private final WebSocketService webSocketService;

    @Transactional
    public Notification createNotification(Long userId, String title, String message,
                                           Notification.NotificationType type,
                                           Long referenceId, String referenceType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);

        // Push via WebSocket
        webSocketService.sendNotification(userId, title, message, type.name(), referenceId);

        return notification;
    }

    public List<Map<String, Object>> getUserNotifications(Long userId) {
        return notificationRepository.findTop20ByUserUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToMap)
                .collect(Collectors.toList());
    }

    public Page<Notification> getUserNotificationsPaginated(Long userId, int page, int size) {
        return notificationRepository.findByUserUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size));
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.markAsRead(notificationId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    private Map<String, Object> mapToMap(Notification n) {
        return Map.of(
                "id", n.getNotificationId(),
                "title", n.getTitle(),
                "message", n.getMessage() != null ? n.getMessage() : "",
                "type", n.getType().name(),
                "isRead", n.isRead(),
                "createdAt", n.getCreatedAt().toString(),
                "referenceId", n.getReferenceId() != null ? n.getReferenceId() : 0
        );
    }

    @Transactional
    public Map<String, Object> sendNgoNotification(String ngoEmail, NgoNotificationRequest request) {
        User ngoUser = userRepository.findByEmail(ngoEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", ngoEmail));

        String audience = normalizeAudience(request.getAudience());
        String notificationType = normalizeNotificationType(request.getNotificationType());
        boolean sendEmail = Boolean.TRUE.equals(request.getSendEmail());

        Campaign campaign = null;
        if (request.getCampaignId() != null) {
            campaign = campaignRepository.findById(request.getCampaignId())
                    .orElseThrow(() -> new ResourceNotFoundException("Campaign", "id", request.getCampaignId()));
            String ownerEmail = campaign.getNgo() != null ? campaign.getNgo().getEmail() : null;
            if (ownerEmail == null || !ownerEmail.equalsIgnoreCase(ngoEmail)) {
                throw new AccessDeniedException("You can only notify for your NGO campaigns");
            }
        }

        PickupRequest pickup = null;
        if (request.getPickupId() != null) {
            pickup = pickupRequestRepository.findByPickupIdAndDonationCampaignNgoEmail(request.getPickupId(), ngoEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("PickupRequest", "id", request.getPickupId()));
        }

        List<User> recipients = resolveRecipients(ngoEmail, audience, campaign, pickup);
        int totalAudienceRecipients = recipients.size();
        recipients = applyRecipientFilters(recipients, request, audience);
        if (recipients.isEmpty()) {
            return Map.of(
                    "sent", 0,
                    "emailSent", 0,
                    "audience", audience,
                    "type", notificationType,
                    "templateKey", request.getTemplateKey(),
                    "audienceRecipients", totalAudienceRecipients,
                    "targetedRecipients", 0,
                    "message", "No recipients found for selected audience"
            );
        }

        Notification.NotificationType channelType = toEntityType(notificationType);
        Long referenceId = request.getPickupId() != null ? request.getPickupId() : request.getCampaignId();
        String referenceType = request.getPickupId() != null ? "PICKUP" : (request.getCampaignId() != null ? "CAMPAIGN" : "NGO");

        int sentCount = 0;
        int emailCount = 0;
        List<String> recipientEmails = new ArrayList<>();

        for (User recipient : recipients) {
            createNotification(
                    recipient.getUserId(),
                    request.getTitle().trim(),
                    request.getMessage().trim(),
                    channelType,
                    referenceId,
                    referenceType
            );
            sentCount++;

            if (sendEmail && recipient.getEmail() != null && !recipient.getEmail().isBlank()) {
                emailService.sendNgoNotificationEmail(
                        recipient.getEmail(),
                        ngoUser.getName(),
                        request.getTitle(),
                        request.getMessage()
                );
                emailCount++;
                recipientEmails.add(recipient.getEmail());
            }
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sent", sentCount);
        payload.put("emailSent", emailCount);
        payload.put("audience", audience);
        payload.put("type", notificationType);
        payload.put("templateKey", request.getTemplateKey());
        payload.put("referenceId", referenceId);
        payload.put("referenceType", referenceType);
        payload.put("audienceRecipients", totalAudienceRecipients);
        payload.put("targetedRecipients", recipients.size());
        payload.put("emails", recipientEmails);
        return payload;
    }

    private List<User> applyRecipientFilters(List<User> recipients, NgoNotificationRequest request, String audience) {
        if (recipients == null || recipients.isEmpty()) {
            return List.of();
        }

        Set<Long> allowedUserIds = request.getRecipientUserIds() == null
                ? Set.of()
                : request.getRecipientUserIds().stream().filter(id -> id != null && id > 0).collect(Collectors.toSet());
        Set<String> allowedEmails = request.getRecipientEmails() == null
                ? Set.of()
                : request.getRecipientEmails().stream()
                .map(value -> value != null ? value.trim().toLowerCase(Locale.ROOT) : "")
                .filter(value -> !value.isBlank())
                .collect(Collectors.toSet());

        if (allowedUserIds.isEmpty() && allowedEmails.isEmpty()) {
            return recipients;
        }

        Set<User> filtered = new LinkedHashSet<>();
        for (User recipient : recipients) {
            if (recipient == null) continue;
            Long userId = recipient.getUserId();
            String email = recipient.getEmail() != null ? recipient.getEmail().trim().toLowerCase(Locale.ROOT) : "";

            boolean selectedById = userId != null && allowedUserIds.contains(userId);
            boolean selectedByEmail = !email.isBlank() && allowedEmails.contains(email);

            if ("VOLUNTEERS".equals(audience)) {
                if (selectedById || selectedByEmail) {
                    filtered.add(recipient);
                }
                continue;
            }

            if (selectedByEmail || selectedById) {
                filtered.add(recipient);
            }
        }

        return new ArrayList<>(filtered);
    }

    private List<User> resolveRecipients(String ngoEmail, String audience, Campaign campaign, PickupRequest pickup) {
        Set<User> recipients = new LinkedHashSet<>();

        if ("VOLUNTEERS".equals(audience)) {
            if (pickup != null) {
                taskAssignmentRepository.findByPickupRequestPickupId(pickup.getPickupId()).forEach(task -> {
                    Volunteer volunteer = task.getVolunteer();
                    if (volunteer != null && volunteer.getUser() != null && volunteer.getNgo() != null
                            && ngoEmail.equalsIgnoreCase(volunteer.getNgo().getEmail())) {
                        recipients.add(volunteer.getUser());
                    }
                });
            }

            if (recipients.isEmpty()) {
                volunteerRepository.findByNgoEmailAndVolunteerStatus(ngoEmail, VolunteerStatus.ACTIVE)
                        .stream()
                        .map(Volunteer::getUser)
                        .filter(user -> user != null)
                        .forEach(recipients::add);
            }
            return new ArrayList<>(recipients);
        }

        if (campaign != null) {
            recipients.addAll(donationRepository.findDistinctDonorUsersByCampaignId(campaign.getCampaignId()));
        }
        if (pickup != null && pickup.getDonation() != null && pickup.getDonation().getUser() != null) {
            recipients.add(pickup.getDonation().getUser());
        }
        if (recipients.isEmpty()) {
            recipients.addAll(donationRepository.findDistinctDonorUsersByNgoEmail(ngoEmail));
        }
        return new ArrayList<>(recipients);
    }

    private String normalizeAudience(String audience) {
        String normalized = String.valueOf(audience).trim().toUpperCase(Locale.ROOT);
        if (normalized.isBlank()) {
            return "DONORS";
        }
        if (!"DONORS".equals(normalized) && !"VOLUNTEERS".equals(normalized)) {
            throw new BadRequestException("Unsupported audience: " + audience);
        }
        return normalized;
    }

    private String normalizeNotificationType(String type) {
        String normalized = String.valueOf(type).trim().toUpperCase(Locale.ROOT);
        if (normalized.isBlank()) {
            return "GENERAL";
        }
        if (!"GENERAL".equals(normalized) && !"CAMPAIGN_UPDATE".equals(normalized) && !"PICKUP_ALERT".equals(normalized)) {
            throw new BadRequestException("Unsupported notification type: " + type);
        }
        return normalized;
    }

    private Notification.NotificationType toEntityType(String notificationType) {
        if ("CAMPAIGN_UPDATE".equals(notificationType)) {
            return Notification.NotificationType.CAMPAIGN;
        }
        if ("PICKUP_ALERT".equals(notificationType)) {
            return Notification.NotificationType.PICKUP;
        }
        return Notification.NotificationType.SYSTEM;
    }
}