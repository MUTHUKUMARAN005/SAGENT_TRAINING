// src/main/java/com/daansetu/entity/SmsLog.java
package com.daansetu.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sms_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SmsLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(columnDefinition = "TEXT")
    private String message;

    private String purpose;

    @Enumerated(EnumType.STRING)
    private SmsStatus status = SmsStatus.QUEUED;

    private String providerSid;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    private LocalDateTime sentAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum SmsStatus {
        QUEUED, SENT, DELIVERED, FAILED
    }
}