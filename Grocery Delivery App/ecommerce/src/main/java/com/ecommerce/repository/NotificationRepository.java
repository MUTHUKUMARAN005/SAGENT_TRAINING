package com.ecommerce.repository;

import com.ecommerce.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUser_UserIdOrderBySentAtDesc(Integer userId);
    List<Notification> findByStatus(Notification.NotificationStatus status);
}