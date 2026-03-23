// src/main/java/com/daansetu/entity/UrgentNeed.java
package com.daansetu.entity;

import com.daansetu.enums.UrgentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "urgent_needs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UrgentNeed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long urgentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private User admin;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    private UrgentStatus urgentStatus = UrgentStatus.PENDING;
}