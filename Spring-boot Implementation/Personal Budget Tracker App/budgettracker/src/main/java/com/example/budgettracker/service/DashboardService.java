package com.example.budgettracker.service;

import com.example.budgettracker.dto.DashboardDTO;
import com.example.budgettracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

import com.example.budgettracker.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
public class DashboardService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private IncomeRepository incomeRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private GoalRepository goalRepository;

    @Autowired
    private AlertRepository alertRepository;

    public DashboardDTO getDashboard(Integer userId) {

        DashboardDTO dto = new DashboardDTO();

        // Total Balance
        BigDecimal totalBalance = accountRepository
                .getTotalBalanceByUserId(userId);
        dto.setTotalBalance(totalBalance);

        // Total Income
        BigDecimal totalIncome = incomeRepository
                .getTotalIncomeByUserId(userId);
        dto.setTotalIncome(totalIncome);

        // Total Expense
        BigDecimal totalExpense = expenseRepository
                .getTotalExpenseByUserId(userId);
        dto.setTotalExpense(totalExpense);

        // Savings = Income - Expense
        dto.setSavings(totalIncome.subtract(totalExpense));

        // Counts
        dto.setAccountCount(
                accountRepository.findByUserUserId(userId).size()
        );

        dto.setActiveGoals(
                goalRepository.findByUserUserIdAndStatus(userId, "ACTIVE").size()
        );

        dto.setUnreadAlerts(
                alertRepository.countByUserUserIdAndIsRead(userId, false)
        );

        // Expense by category
        List<Object[]> categoryData = expenseRepository
                .getExpenseByCategoryForUser(userId);

        List<Map<String, Object>> categoryExpenses = new ArrayList<>();
        for (Object[] row : categoryData) {
            Map<String, Object> map = new HashMap<>();
            map.put("category", row[0]);
            map.put("total", row[1]);
            categoryExpenses.add(map);
        }
        dto.setExpenseByCategory(categoryExpenses);

        return dto;
    }
}