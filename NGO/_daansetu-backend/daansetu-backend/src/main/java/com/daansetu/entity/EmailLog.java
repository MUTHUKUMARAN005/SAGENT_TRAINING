// src/main/java/com/daansetu/entity/EmailLog.java
package com.daansetu.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String recipientEmail;

    private String subject;
    private String templateName;

    @Enumerated(EnumType.STRING)
    private EmailStatus status = EmailStatus.QUEUED;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    private LocalDateTime sentAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum EmailStatus {
        QUEUED, SENT, FAILED, BOUNCED
    }
}