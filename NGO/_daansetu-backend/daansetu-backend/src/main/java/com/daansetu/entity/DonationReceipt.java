// src/main/java/com/daansetu/entity/DonationReceipt.java
package com.daansetu.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "donation_receipts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DonationReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long receiptId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donation_id", nullable = false)
    private Donation donation;

    @Column(unique = true, nullable = false)
    private String receiptNumber;

    @CreationTimestamp
    private LocalDateTime issuedDate;

    private String certificateUrl;
    private String pdfUrl;
    private boolean emailSent = false;
}