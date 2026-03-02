// model/Notification.java
package com.library.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "Notification")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Notification {
    @Id
    @Column(name = "NotificationID", length = 50)
    private String notificationId;

    @ManyToOne
    @JoinColumn(name = "MemberID", nullable = false)
    private Member member;

    @Column(name = "Type", length = 100, nullable = false)
    private String type;

    @Column(name = "Message", length = 500)
    private String message;

    @Column(name = "SentDate", nullable = false)
    private LocalDate sentDate;

    @Column(name = "Status", length = 50, nullable = false)
    private String status;
}