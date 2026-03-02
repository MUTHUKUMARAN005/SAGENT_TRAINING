package com.example.budgettracker.dto;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {

    private BigDecimal totalBalance;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal savings;
    private int accountCount;
    private int activeGoals;
    private long unreadAlerts;
    private List<Map<String, Object>> expenseByCategory;
}