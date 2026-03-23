package com.daansetu.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class NgoNotificationRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String message;

    // DONORS, VOLUNTEERS
    private String audience;

    // GENERAL, CAMPAIGN_UPDATE, PICKUP_ALERT
    private String notificationType;

    // Optional frontend template identifier for reporting/debugging.
    private String templateKey;

    private Long campaignId;
    private Long pickupId;

    // If true, notifications are also sent via email.
    private Boolean sendEmail;

    // Optional targeted recipients (when empty, all recipients for audience are used).
    private List<Long> recipientUserIds;
    private List<String> recipientEmails;
}
