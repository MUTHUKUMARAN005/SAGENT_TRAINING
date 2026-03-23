// src/main/java/com/daansetu/entity/Donation.java
package com.daansetu.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.daansetu.enums.DonationStatus;
import com.daansetu.enums.DonationType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "donations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long donationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private Campaign campaign;

    @Enumerated(EnumType.STRING)
    private DonationType donationType;

    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private DonationStatus donationStatus = DonationStatus.PENDING;

    @CreationTimestamp
    private LocalDateTime donationDate;

    private String message;
    private boolean anonymous = false;

    @JsonIgnore
    @OneToOne(mappedBy = "donation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Payment payment;

    @JsonIgnore
    @OneToOne(mappedBy = "donation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private DonationReceipt receipt;

    @JsonIgnore
    @OneToOne(mappedBy = "donation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private PickupRequest pickupRequest;

    @JsonIgnore
    @OneToOne(mappedBy = "donation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private BlockchainTransaction blockchainTransaction;
}
