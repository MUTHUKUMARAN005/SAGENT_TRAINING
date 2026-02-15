// File: src/main/java/com/healthcare/repository/NotificationRepository.java
package com.healthcare.repository;

import com.healthcare.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUserUserIdOrderByCreatedAtDesc(Integer userId);
    long countByUserUserIdAndIsReadFalse(Integer userId);
}