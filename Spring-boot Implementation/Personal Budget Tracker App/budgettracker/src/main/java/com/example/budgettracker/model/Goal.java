package com.example.budgettracker.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Goal")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "goal_id")
    private Integer goalId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "goal_name", length = 100)
    private String goalName;

    @Column(name = "target_amount", precision = 12, scale = 2)
    private BigDecimal targetAmount;

    @Column(name = "current_amount", precision = 12, scale = 2)
    private BigDecimal currentAmount;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(length = 50)
    private String status;
}