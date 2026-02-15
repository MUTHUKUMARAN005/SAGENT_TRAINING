package com.example.budgettracker.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;


@Entity
@Table(name = "Income")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Income {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "income_id")
    private Integer incomeId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "income_type", length = 50)
    private String incomeType;

    @Column(length = 255)
    private String description;

    @Column(name = "date_received")
    private LocalDate dateReceived;

    @Column(name = "is_recurring")
    private Boolean isRecurring;
}