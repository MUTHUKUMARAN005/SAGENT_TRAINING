// src/main/java/com/daansetu/service/ScheduledTaskService.java
package com.daansetu.service;

import com.daansetu.entity.Notification;
import com.daansetu.entity.PickupRequest;
import com.daansetu.enums.PickupStatus;
import com.daansetu.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledTaskService {

    private final PickupRequestRepository pickupRepository;
    private final NotificationRepository notificationRepository;
    private final SmsService smsService;
    private final WebSocketService webSocketService;

    // ============================================
    // SEND PICKUP REMINDERS (Daily at 6 PM)
    // ============================================
    @Scheduled(cron = "0 0 18 * * *")
    @Transactional
    public void sendPickupReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        List<PickupRequest> tomorrowPickups = pickupRepository.findByPickupStatusIn(
                        EnumSet.of(PickupStatus.APPROVED, PickupStatus.ASSIGNED, PickupStatus.SCHEDULED))
                .stream()
                .filter(p -> p.getPickupDate() != null && p.getPickupDate().equals(tomorrow))
                .filter(p -> !p.isReminderSent())
                .toList();

        for (PickupRequest pickup : tomorrowPickups) {
            try {
                String donorPhone = pickup.getContactPhone();
                String donorName = pickup.getDonation().getUser().getName();
                Long userId = pickup.getDonation().getUser().getUserId();

                // Send SMS reminder
                if (donorPhone != null && !donorPhone.isBlank()) {
                    smsService.sendPickupReminder(
                            donorPhone,
                            donorName,
                            pickup.getPickupDate().toString(),
                            pickup.getTimeSlot(),
                            pickup.getDonorAddress()
                    );
                }

                // Create notification
                Notification notification = Notification.builder()
                        .user(pickup.getDonation().getUser())
                        .title("📦 Pickup Reminder")
                        .message("Your donation pickup is scheduled for tomorrow (" +
                                pickup.getPickupDate() + ") at " + pickup.getTimeSlot())
                        .type(Notification.NotificationType.PICKUP)
                        .referenceId(pickup.getPickupId())
                        .referenceType("PICKUP")
                        .build();
                notificationRepository.save(notification);

                // WebSocket notification
                webSocketService.sendNotification(
                        userId,
                        "Pickup Tomorrow!",
                        "Your donation pickup is scheduled for tomorrow at " + pickup.getTimeSlot(),
                        "PICKUP",
                        pickup.getPickupId()
                );

                pickup.setReminderSent(true);
                pickupRepository.save(pickup);

                log.info("Pickup reminder sent to {} for pickup {}", donorPhone, pickup.getPickupId());

            } catch (Exception e) {
                log.error("Failed to send pickup reminder for pickup {}: {}", pickup.getPickupId(), e.getMessage());
            }
        }

        log.info("Pickup reminders processed: {} reminders sent", tomorrowPickups.size());
    }

    // ============================================
    // CLEANUP EXPIRED OTPS (Every hour)
    // ============================================
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredOtps() {
        log.info("Running OTP cleanup task...");
        // Handled by DB TTL or manual cleanup
    }
}
