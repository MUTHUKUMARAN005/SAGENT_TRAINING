package com.daansetu.entity;

import com.daansetu.enums.PickupStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pickup_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PickupRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pickupId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donation_id", nullable = false)
    private Donation donation;

    @Column(columnDefinition = "TEXT")
    private String donorAddress;

    private LocalDate pickupDate;
    private String timeSlot;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PickupStatus pickupStatus = PickupStatus.PENDING;

    private String contactPhone;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private Double latitude;
    private Double longitude;

    private Double volunteerLatitude;
    private Double volunteerLongitude;
    private LocalDateTime volunteerLocationUpdatedAt;

    @Builder.Default
    private boolean otpVerified = false;

    private LocalDateTime otpVerifiedAt;

    @Builder.Default
    private boolean reminderSent = false;
}
