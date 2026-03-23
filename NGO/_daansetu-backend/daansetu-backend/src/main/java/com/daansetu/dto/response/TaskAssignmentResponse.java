package com.daansetu.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TaskAssignmentResponse {

    private Long taskId;
    private Long pickupId;
    private Long donationId;
    private String description;
    private String status; // PENDING, IN_PROGRESS, COMPLETED
    private LocalDateTime assignedDate;
    private LocalDateTime completedDate;

    // Donor Information
    private Long donorId;
    private String donorName;
    private String donorPhone;
    private String donorEmail;

    // Pickup Details
    private String address;
    private String itemType; // FOOD, CLOTHES, BOOKS, MEDICAL, FURNITURE, OTHER
    private LocalDate pickupDate;
    private String timeSlot;
    private String contactPhone;
    private String notes;

    // Location coordinates for map
    private Double latitude;
    private Double longitude;
    private Double volunteerLatitude;
    private Double volunteerLongitude;
    private LocalDateTime volunteerLocationUpdatedAt;

    // Pickup status
    private String pickupStatus;
    private boolean otpVerified;
    private LocalDateTime otpVerifiedAt;
}

