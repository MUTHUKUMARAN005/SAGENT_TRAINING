package com.daansetu.service;

import com.daansetu.dto.response.PageResponse;
import com.daansetu.dto.response.UserResponse;
import com.daansetu.entity.User;
import com.daansetu.enums.UserRole;
import com.daansetu.exception.BadRequestException;
import com.daansetu.exception.DuplicateResourceException;
import com.daansetu.exception.ResourceNotFoundException;
import com.daansetu.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final NotificationRepository notificationRepository;
    private final DonationRequestRepository donationRequestRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final DonationItemRepository donationItemRepository;
    private final DonationRepository donationRepository;
    private final OtpRepository otpRepository;

    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return mapToResponse(user);
    }

    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return mapToResponse(user);
    }

    public PageResponse<UserResponse> getAllUsers(int page, int size, String role) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> users;
        if (role != null && !role.isBlank()) {
            users = userRepository.findByRole(UserRole.valueOf(role.toUpperCase()), pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        List<UserResponse> content = users.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.<UserResponse>builder()
                .content(content)
                .page(users.getNumber())
                .size(users.getSize())
                .totalElements(users.getTotalElements())
                .totalPages(users.getTotalPages())
                .last(users.isLast())
                .build();
    }

    @Transactional
    public UserResponse updateUser(Long userId, String name, String phone, String address, String city) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (name != null && !name.isBlank()) user.setName(name);
        if (phone != null && !phone.isBlank()) user.setPhone(phone);
        if (address != null && !address.isBlank()) user.setAddress(address);
        if (city != null && !city.isBlank()) user.setCity(city);

        user = userRepository.save(user);
        log.info("User updated: {}", user.getEmail());
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateUserByAdmin(Long userId,
                                          String name,
                                          String email,
                                          String phone,
                                          String address,
                                          String city,
                                          Boolean active,
                                          String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (name != null) {
            String nextName = name.trim();
            if (nextName.isBlank()) {
                throw new BadRequestException("Name cannot be empty");
            }
            user.setName(nextName);
        }

        if (email != null) {
            String normalizedEmail = email.trim().toLowerCase();
            if (normalizedEmail.isBlank()) {
                throw new BadRequestException("Email cannot be empty");
            }

            Optional<User> existing = userRepository.findByEmailIgnoreCase(normalizedEmail);
            if (existing.isPresent() && !existing.get().getUserId().equals(userId)) {
                throw new DuplicateResourceException("User", "email", normalizedEmail);
            }
            user.setEmail(normalizedEmail);
        }

        if (phone != null) {
            String nextPhone = phone.trim();
            user.setPhone(nextPhone.isBlank() ? null : nextPhone);
        }

        if (address != null) {
            String nextAddress = address.trim();
            user.setAddress(nextAddress.isBlank() ? null : nextAddress);
        }

        if (city != null) {
            String nextCity = city.trim();
            user.setCity(nextCity.isBlank() ? null : nextCity);
        }

        if (active != null) {
            if (user.getRole() == UserRole.ADMIN && !active) {
                throw new BadRequestException("Admin users cannot be blocked");
            }
            user.setActive(active);
        }

        Boolean statusAsActive = mapStatusToActive(status);
        if (statusAsActive != null) {
            if (user.getRole() == UserRole.ADMIN && !statusAsActive) {
                throw new BadRequestException("Admin users cannot be blocked");
            }
            user.setActive(statusAsActive);
        }

        user = userRepository.save(user);
        log.info("Admin updated user: {} (id={})", user.getEmail(), user.getUserId());
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateUserStatusByAdmin(Long userId, Boolean active, String status) {
        if (active == null && (status == null || status.isBlank())) {
            throw new BadRequestException("Either active flag or status is required");
        }
        return updateUserByAdmin(userId, null, null, null, null, null, active, status);
    }

    @Transactional
    public UserResponse updateUserLocation(Long userId, Double latitude, Double longitude) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        if (latitude != null) user.setLatitude(latitude);
        if (longitude != null) user.setLongitude(longitude);
        user = userRepository.save(user);
        log.info("User location updated: {}", user.getEmail());
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateUserNotificationPreferences(Long userId,
                                                          Boolean emailUpdatesEnabled,
                                                          Boolean smsNotificationsEnabled,
                                                          Boolean campaignAlertsEnabled,
                                                          Boolean weeklyDigestEnabled,
                                                          Boolean pickupRemindersEnabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (emailUpdatesEnabled != null) user.setEmailUpdatesEnabled(emailUpdatesEnabled);
        if (smsNotificationsEnabled != null) user.setSmsNotificationsEnabled(smsNotificationsEnabled);
        if (campaignAlertsEnabled != null) user.setCampaignAlertsEnabled(campaignAlertsEnabled);
        if (weeklyDigestEnabled != null) user.setWeeklyDigestEnabled(weeklyDigestEnabled);
        if (pickupRemindersEnabled != null) user.setPickupRemindersEnabled(pickupRemindersEnabled);

        user = userRepository.save(user);
        log.info("User notification preferences updated: {}", user.getEmail());
        return mapToResponse(user);
    }

    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new com.daansetu.exception.BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password changed for user: {}", user.getEmail());
    }

    @Transactional
    public void deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setActive(false);
        userRepository.save(user);
        log.info("User deactivated: {}", user.getEmail());
    }

    @Transactional
    public void deleteAccount(Long userId, String currentPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (currentPassword == null || currentPassword.isBlank()) {
            throw new BadRequestException("Current password is required to delete account");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        deleteUserWithDependencies(user);
        log.info("User account deleted permanently: {}", user.getEmail());
    }

    @Transactional
    public void deleteUserByAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getRole() == UserRole.ADMIN) {
            throw new BadRequestException("Admin users cannot be deleted from dashboard");
        }

        deleteUserWithDependencies(user);
        log.info("Admin deleted user account: {} (id={})", user.getEmail(), user.getUserId());
    }

    private void deleteUserWithDependencies(User user) {
        Long userId = user.getUserId();

        // Delete dependents in a deterministic order before removing the user row.
        taskAssignmentRepository.deleteByVolunteerUserUserId(userId);
        donationItemRepository.deleteByDonationUserUserId(userId);
        donationRequestRepository.deleteByUserUserId(userId);
        donationRepository.deleteByUserUserId(userId);
        notificationRepository.deleteByUserUserId(userId);
        emailVerificationTokenRepository.deleteByUserUserId(userId);
        passwordResetTokenRepository.deleteByUserUserId(userId);

        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            otpRepository.deleteByEmail(user.getEmail());
        }
        if (user.getPhone() != null && !user.getPhone().isBlank()) {
            otpRepository.deleteByPhone(user.getPhone());
        }

        userRepository.delete(user);
    }

    private Boolean mapStatusToActive(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        String normalized = status.trim().toLowerCase();
        if ("active".equals(normalized)) {
            return true;
        }
        if ("blocked".equals(normalized)) {
            return false;
        }
        throw new BadRequestException("Status must be either 'active' or 'blocked'");
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .city(user.getCity())
                .latitude(user.getLatitude())
                .longitude(user.getLongitude())
                .role(user.getRole())
                .profileImage(user.getProfileImage())
                .active(user.isActive())
                .emailVerified(user.isEmailVerified())
                .phoneVerified(user.isPhoneVerified())
                .emailUpdatesEnabled(user.isEmailUpdatesEnabled())
                .smsNotificationsEnabled(user.isSmsNotificationsEnabled())
                .campaignAlertsEnabled(user.isCampaignAlertsEnabled())
                .weeklyDigestEnabled(user.isWeeklyDigestEnabled())
                .pickupRemindersEnabled(user.isPickupRemindersEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
