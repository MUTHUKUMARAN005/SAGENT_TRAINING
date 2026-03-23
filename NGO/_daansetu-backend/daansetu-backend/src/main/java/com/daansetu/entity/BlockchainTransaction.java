// src/main/java/com/daansetu/entity/BlockchainTransaction.java
package com.daansetu.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "blockchain_transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BlockchainTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donation_id", nullable = false)
    private Donation donation;

    @Column(unique = true)
    private String txHash;

    private Long blockNumber;
    private String fromAddress;
    private String toAddress;
    private String contractAddress;
    private String network;
    private Integer confirmations;
    private String status;

    @CreationTimestamp
    private LocalDateTime timestamp;

    @Column(columnDefinition = "TEXT")
    private String rawData;
}