package com.daansetu.dto.response;

import com.daansetu.enums.UserRole;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String city;
    private Double latitude;
    private Double longitude;
    private UserRole role;
    private String profileImage;
    private boolean active;
    private boolean emailVerified;
    private boolean phoneVerified;
    private boolean emailUpdatesEnabled;
    private boolean smsNotificationsEnabled;
    private boolean campaignAlertsEnabled;
    private boolean weeklyDigestEnabled;
    private boolean pickupRemindersEnabled;
    private LocalDateTime createdAt;
}