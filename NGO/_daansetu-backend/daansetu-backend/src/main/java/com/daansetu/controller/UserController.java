package com.daansetu.controller;

import com.daansetu.dto.response.ApiResponse;
import com.daansetu.dto.response.PageResponse;
import com.daansetu.dto.response.UserResponse;
import com.daansetu.entity.User;
import com.daansetu.repository.UserRepository;
import com.daansetu.service.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(Authentication authentication) {
        UserResponse user = userService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String role) {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers(page, size, role)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserByAdmin(
            @PathVariable Long id,
            @RequestBody AdminUpdateUserRequest request) {
        UserResponse updated = userService.updateUserByAdmin(
                id,
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                request.getAddress(),
                request.getCity(),
                request.getActive(),
                request.getStatus()
        );
        return ResponseEntity.ok(ApiResponse.success("User updated", updated));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatusByAdmin(
            @PathVariable Long id,
            @RequestBody AdminUpdateUserStatusRequest request) {
        UserResponse updated = userService.updateUserStatusByAdmin(id, request.getActive(), request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("User status updated", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteUserByAdmin(@PathVariable Long id) {
        userService.deleteUserByAdmin(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted"));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            Authentication authentication,
            @RequestBody UpdateProfileRequest request) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        Long userId = user.getUserId();
        userService.updateUser(userId, request.getName(), request.getPhone(), request.getAddress(), request.getCity());
        userService.updateUserLocation(userId, request.getLatitude(), request.getLongitude());
        UserResponse updated = userService.updateUserNotificationPreferences(userId, request.getEmailUpdatesEnabled(), request.getSmsNotificationsEnabled(), request.getCampaignAlertsEnabled(), request.getWeeklyDigestEnabled(), request.getPickupRemindersEnabled());
        return ResponseEntity.ok(ApiResponse.success("Profile updated", updated));
    }

    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            Authentication authentication,
            @RequestBody ChangePasswordRequest request) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        userService.changePassword(user.getUserId(), request.getOldPassword(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<String>> deleteMyAccount(
            Authentication authentication,
            @RequestBody DeleteAccountRequest request) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        userService.deleteAccount(user.getUserId(), request.getPassword());
        return ResponseEntity.ok(ApiResponse.success("Account deleted permanently"));
    }

    @Data
    public static class UpdateProfileRequest {
        private String name;
        private String phone;
        private String address;
        private String city;
        private Double latitude;
        private Double longitude;
        private Boolean emailUpdatesEnabled;
        private Boolean smsNotificationsEnabled;
        private Boolean campaignAlertsEnabled;
        private Boolean weeklyDigestEnabled;
        private Boolean pickupRemindersEnabled;
    }

    @Data
    public static class ChangePasswordRequest {
        private String oldPassword;
        private String newPassword;
    }

    @Data
    public static class DeleteAccountRequest {
        private String password;
    }

    @Data
    public static class AdminUpdateUserRequest {
        private String name;
        private String email;
        private String phone;
        private String address;
        private String city;
        private Boolean active;
        private String status;
    }

    @Data
    public static class AdminUpdateUserStatusRequest {
        private Boolean active;
        private String status;
    }
}
