package com.example.budgettracker.service;

import com.example.budgettracker.model.Budget;
import com.example.budgettracker.repository.BudgetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class BudgetService {

    @Autowired
    private BudgetRepository budgetRepository;

    public List<Budget> getAllBudgets() {
        return budgetRepository.findAll();
    }

    public Optional<Budget> getBudgetById(Integer id) {
        return budgetRepository.findById(id);
    }

    public List<Budget> getBudgetsByUserId(Integer userId) {
        return budgetRepository.findByUserUserId(userId);
    }

    public List<Budget> getBudgetsByUserAndMonth(
            Integer userId, String monthYear) {
        return budgetRepository
                .findByUserUserIdAndMonthYear(userId, monthYear);
    }

    public Budget createBudget(Budget budget) {
        if (budget.getAmountSpent() == null) {
            budget.setAmountSpent(BigDecimal.ZERO);
        }
        return budgetRepository.save(budget);
    }

    public Budget updateBudget(Integer id, Budget details) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Budget not found with ID: " + id
                ));

        budget.setAmountLimit(details.getAmountLimit());
        budget.setAmountSpent(details.getAmountSpent());
        budget.setMonthYear(details.getMonthYear());

        return budgetRepository.save(budget);
    }

    public void deleteBudget(Integer id) {
        if (!budgetRepository.existsById(id)) {
            throw new RuntimeException("Budget not found with ID: " + id);
        }
        budgetRepository.deleteById(id);
    }
}