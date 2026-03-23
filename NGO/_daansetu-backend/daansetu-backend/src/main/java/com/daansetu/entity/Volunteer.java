// src/main/java/com/daansetu/entity/Volunteer.java
package com.daansetu.entity;

import com.daansetu.enums.VolunteerStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "volunteers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Volunteer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long volunteerId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ngo_id")
    private NGO ngo;

    @Enumerated(EnumType.STRING)
    private VolunteerStatus volunteerStatus = VolunteerStatus.ACTIVE;

    @CreationTimestamp
    private LocalDate joinedDate;

    private Integer hoursVolunteered = 0;
    private Integer tasksCompleted = 0;

    @OneToMany(mappedBy = "volunteer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TaskAssignment> tasks = new ArrayList<>();
}