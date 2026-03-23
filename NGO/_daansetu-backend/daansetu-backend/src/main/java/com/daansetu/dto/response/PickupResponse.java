package com.daansetu.dto.response;

import com.daansetu.enums.PickupStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PickupResponse {
    private Long pickupId;
    private Long donationId;
    private Long donorId;
    private String donorName;
    private String donorAddress;
    private LocalDate pickupDate;
    private String timeSlot;
    private PickupStatus pickupStatus;
    private String contactPhone;
    private String notes;
    private Double latitude;
    private Double longitude;
    private Double volunteerLatitude;
    private Double volunteerLongitude;
    private LocalDateTime volunteerLocationUpdatedAt;
    private String volunteerName;
    private String volunteerPhone;
    private boolean otpVerified;
    private LocalDateTime otpVerifiedAt;
    private boolean reminderSent;
    private List<String> items;
}
