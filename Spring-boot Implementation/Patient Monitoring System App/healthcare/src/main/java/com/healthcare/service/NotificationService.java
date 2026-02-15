// File: src/main/java/com/healthcare/service/NotificationService.java
package com.healthcare.service;

import com.healthcare.model.Notification;
import com.healthcare.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository repository;

    public List<Notification> getByUserId(Integer userId) {
        return repository.findByUserUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Integer userId) {
        return repository.countByUserUserIdAndIsReadFalse(userId);
    }

    public Notification markAsRead(Integer notificationId) {
        Notification notification = repository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        return repository.save(notification);
    }

    public Notification save(Notification notification) {
        return repository.save(notification);
    }
}