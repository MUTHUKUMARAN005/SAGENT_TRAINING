// src/main/java/com/daansetu/repository/NotificationRepository.java
package com.daansetu.repository;

import com.daansetu.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    List<Notification> findTop20ByUserUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserUserIdAndIsReadFalse(Long userId);
    void deleteByUserUserId(Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.userId = :userId")
    void markAllAsRead(Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.notificationId = :id")
    void markAsRead(Long id);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.notificationId = :id AND n.user.userId = :userId")
    void markAsReadForUser(Long id, Long userId);
}