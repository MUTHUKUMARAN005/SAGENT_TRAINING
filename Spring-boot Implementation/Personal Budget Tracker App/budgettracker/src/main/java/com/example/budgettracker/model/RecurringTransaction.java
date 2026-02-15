package com.example.budgettracker.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;


@Entity
@Table(name = "RecurringTransaction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecurringTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recurring_id")
    private Integer recurringId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "transaction_type", length = 50)
    private String transactionType;

    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 50)
    private String frequency;

    @Column(name = "next_date")
    private LocalDate nextDate;

    @Column(name = "is_active")
    private Boolean isActive;
}