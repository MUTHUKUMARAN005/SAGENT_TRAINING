// src/main/java/com/daansetu/controller/NotificationController.java
package com.daansetu.controller;

import com.daansetu.dto.request.NgoNotificationRequest;
import com.daansetu.dto.response.ApiResponse;
import com.daansetu.entity.User;
import com.daansetu.repository.NotificationRepository;
import com.daansetu.repository.UserRepository;
import com.daansetu.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyNotifications(
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();

        List<Map<String, Object>> notifications = notificationRepository
                .findTop20ByUserUserIdOrderByCreatedAtDesc(user.getUserId())
                .stream()
                .map(n -> Map.<String, Object>of(
                        "id", n.getNotificationId(),
                        "title", n.getTitle(),
                        "message", n.getMessage() != null ? n.getMessage() : "",
                        "type", n.getType().name(),
                        "isRead", n.isRead(),
                        "createdAt", n.getCreatedAt().toString(),
                        "referenceId", n.getReferenceId() != null ? n.getReferenceId() : 0
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        long count = notificationRepository.countByUserUserIdAndIsReadFalse(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    @PutMapping("/{id}/read")
    @Transactional
    public ResponseEntity<ApiResponse<String>> markAsRead(@PathVariable Long id, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        notificationRepository.markAsReadForUser(id, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read"));
    }

    @PutMapping("/read-all")
    @Transactional
    public ResponseEntity<ApiResponse<String>> markAllAsRead(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        notificationRepository.markAllAsRead(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
    }

    @PostMapping("/ngo/send")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendNgoNotification(
            Authentication authentication,
            @Valid @RequestBody NgoNotificationRequest request) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(
                "Notification dispatched",
                notificationService.sendNgoNotification(user.getEmail(), request)
        ));
    }
}