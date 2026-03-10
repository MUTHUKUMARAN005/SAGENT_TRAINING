package com.example.budgettracker.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "Account")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "account_id")
    private Integer accountId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "account_name", length = 100)
    private String accountName;

    @Column(name = "account_type", length = 50)
    private String accountType;

    @Column(name = "initial_balance", precision = 12, scale = 2)
    private BigDecimal initialBalance;

    @Column(name = "current_balance", precision = 12, scale = 2)
    private BigDecimal currentBalance;

    @Column(name = "is_active")
    private Boolean isActive;
}