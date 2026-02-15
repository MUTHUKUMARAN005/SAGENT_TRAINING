package com.ecommerce.service;

import com.ecommerce.model.Notification;
import com.ecommerce.model.Order;
import com.ecommerce.model.User;
import com.ecommerce.repository.NotificationRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    public Optional<Notification> getNotificationById(Integer id) {
        return notificationRepository.findById(id);
    }

    public List<Notification> getNotificationsByUserId(Integer userId) {
        return notificationRepository.findByUser_UserIdOrderBySentAtDesc(userId);
    }

    public List<Notification> getNotificationsByStatus(Notification.NotificationStatus status) {
        return notificationRepository.findByStatus(status);
    }

    public Notification createNotification(Notification notification) {
        // Validate user exists
        if (notification.getUser() != null && notification.getUser().getUserId() != null) {
            User user = userRepository.findById(notification.getUser().getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            notification.setUser(user);
        }

        // Validate order exists if provided
        if (notification.getOrder() != null && notification.getOrder().getOrderId() != null) {
            Order order = orderRepository.findById(notification.getOrder().getOrderId())
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            notification.setOrder(order);
        }

        // Set defaults
        if (notification.getSentAt() == null) {
            notification.setSentAt(LocalDateTime.now());
        }
        if (notification.getStatus() == null) {
            notification.setStatus(Notification.NotificationStatus.SENT);
        }

        return notificationRepository.save(notification);
    }

    /**
     * Convenience method to send notification to a user about an order
     */
    public Notification sendOrderNotification(Integer userId, Integer orderId,
                                              String message,
                                              Notification.NotificationType type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        Notification notification = Notification.builder()
                .user(user)
                .order(order)
                .message(message)
                .type(type)
                .sentAt(LocalDateTime.now())
                .status(Notification.NotificationStatus.SENT)
                .build();

        return notificationRepository.save(notification);
    }

    /**
     * Send notifications to all managers/admins about an event
     */
    public List<Notification> notifyAllManagers(Integer orderId, String message,
                                                Notification.NotificationType type) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        List<User> managers = userRepository.findByUserType(User.UserType.MANAGER);
        List<User> admins = userRepository.findByUserType(User.UserType.ADMIN);
        managers.addAll(admins);

        return managers.stream()
                .map(user -> {
                    Notification notification = Notification.builder()
                            .user(user)
                            .order(order)
                            .message(message)
                            .type(type)
                            .sentAt(LocalDateTime.now())
                            .status(Notification.NotificationStatus.SENT)
                            .build();
                    return notificationRepository.save(notification);
                })
                .toList();
    }

    public Notification markAsRead(Integer id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with id: " + id));

        notification.setStatus(Notification.NotificationStatus.READ);
        return notificationRepository.save(notification);
    }

    public void markAllAsRead(Integer userId) {
        List<Notification> notifications = notificationRepository
                .findByUser_UserIdOrderBySentAtDesc(userId);

        notifications.forEach(n -> n.setStatus(Notification.NotificationStatus.READ));
        notificationRepository.saveAll(notifications);
    }

    public long getUnreadCount(Integer userId) {
        return notificationRepository.findByUser_UserIdOrderBySentAtDesc(userId)
                .stream()
                .filter(n -> n.getStatus() == Notification.NotificationStatus.SENT)
                .count();
    }

    public void deleteNotification(Integer id) {
        if (!notificationRepository.existsById(id)) {
            throw new RuntimeException("Notification not found with id: " + id);
        }
        notificationRepository.deleteById(id);
    }
}