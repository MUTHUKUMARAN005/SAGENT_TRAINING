package com.example.budgettracker.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "Budget")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "budget_id")
    private Integer budgetId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "month_year", length = 20)
    private String monthYear;

    @Column(name = "amount_limit", precision = 12, scale = 2)
    private BigDecimal amountLimit;

    @Column(name = "amount_spent", precision = 12, scale = 2)
    private BigDecimal amountSpent;
}