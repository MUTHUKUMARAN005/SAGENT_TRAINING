// src/main/java/com/daansetu/entity/TaskAssignment.java
package com.daansetu.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.daansetu.enums.TaskStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_assignments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TaskAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long taskId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_id")
    private PickupRequest pickupRequest;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "volunteer_id", nullable = false)
    private Volunteer volunteer;

    @CreationTimestamp
    private LocalDateTime assignedDate;

    @Enumerated(EnumType.STRING)
    private TaskStatus taskStatus = TaskStatus.ASSIGNED;

    private String description;
    private LocalDateTime completedDate;
}
