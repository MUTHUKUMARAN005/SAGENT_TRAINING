// src/main/java/com/daansetu/entity/DonationItem.java
package com.daansetu.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "donation_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DonationItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donation_id", nullable = false)
    private Donation donation;

    private String itemName;
    private String category;
    private Integer quantity;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(precision = 10, scale = 2)
    private BigDecimal estimatedValue;
}