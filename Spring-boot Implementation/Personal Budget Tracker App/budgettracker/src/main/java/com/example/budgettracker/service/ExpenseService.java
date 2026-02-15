package com.example.budgettracker.service;

import com.example.budgettracker.model.Account;
import com.example.budgettracker.model.Budget;
import com.example.budgettracker.model.Expense;
import com.example.budgettracker.model.Goal;

import com.example.budgettracker.repository.AccountRepository;
import com.example.budgettracker.repository.BudgetRepository;
import com.example.budgettracker.repository.ExpenseRepository;
import com.example.budgettracker.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;



import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public Optional<Expense> getExpenseById(Integer id) {
        return expenseRepository.findById(id);
    }

    public List<Expense> getExpensesByUserId(Integer userId) {
        return expenseRepository.findByUserUserId(userId);
    }

    public BigDecimal getTotalExpense(Integer userId) {
        return expenseRepository.getTotalExpenseByUserId(userId);
    }

    public List<Map<String, Object>> getExpenseByCategory(Integer userId) {

        List<Object[]> results = expenseRepository
                .getExpenseByCategoryForUser(userId);

        List<Map<String, Object>> categoryExpenses = new ArrayList<>();

        for (Object[] row : results) {
            Map<String, Object> map = new HashMap<>();
            map.put("category", row[0]);
            map.put("total", row[1]);
            categoryExpenses.add(map);
        }

        return categoryExpenses;
    }

    // =================== CREATE ===================
    @Transactional
    public Expense createExpense(Expense expense) {

        // Step 1: Validate
        if (expense.getAmount() == null
                || expense.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Expense amount must be positive"
            );
        }

        // Step 2: Deduct from account
        if (expense.getAccount() != null
                && expense.getAccount().getAccountId() != null) {

            Account account = accountRepository
                    .findById(expense.getAccount().getAccountId())
                    .orElseThrow(() -> new RuntimeException(
                            "Account not found with ID: "
                                    + expense.getAccount().getAccountId()
                    ));

            BigDecimal currentBalance = account.getCurrentBalance() != null
                    ? account.getCurrentBalance()
                    : BigDecimal.ZERO;

            // Check sufficient balance
            if (currentBalance.compareTo(expense.getAmount()) < 0) {
                throw new RuntimeException(
                        "Insufficient balance. Available: " + currentBalance
                );
            }

            account.setCurrentBalance(
                    currentBalance.subtract(expense.getAmount())
            );
            accountRepository.save(account);
            expense.setAccount(account);
        }

        // Step 3: Update budget spent amount
        if (expense.getUser() != null
                && expense.getCategory() != null
                && expense.getDateSpent() != null) {

            String monthYear = expense.getDateSpent()
                    .format(DateTimeFormatter.ofPattern("yyyy-MM"));

            List<Budget> budgets = budgetRepository
                    .findByUserUserIdAndMonthYear(
                            expense.getUser().getUserId(), monthYear
                    );

            for (Budget budget : budgets) {
                if (budget.getCategory().getCategoryId()
                        .equals(expense.getCategory().getCategoryId())) {

                    BigDecimal spent = budget.getAmountSpent() != null
                            ? budget.getAmountSpent()
                            : BigDecimal.ZERO;

                    budget.setAmountSpent(spent.add(expense.getAmount()));
                    budgetRepository.save(budget);
                }
            }
        }

        // Step 4: Save expense
        return expenseRepository.save(expense);
    }

    // =================== UPDATE ===================
    @Transactional
    public Expense updateExpense(Integer id, Expense details) {

        Expense existingExpense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Expense not found with ID: " + id
                ));

        BigDecimal oldAmount = existingExpense.getAmount() != null
                ? existingExpense.getAmount()
                : BigDecimal.ZERO;

        BigDecimal newAmount = details.getAmount() != null
                ? details.getAmount()
                : oldAmount;

        // Adjust account balance if amount changed
        if (oldAmount.compareTo(newAmount) != 0
                && existingExpense.getAccount() != null) {

            Account account = accountRepository
                    .findById(existingExpense.getAccount().getAccountId())
                    .orElseThrow(() -> new RuntimeException(
                            "Account not found"
                    ));

            BigDecimal currentBalance = account.getCurrentBalance() != null
                    ? account.getCurrentBalance()
                    : BigDecimal.ZERO;

            // Add back old amount, deduct new amount
            account.setCurrentBalance(
                    currentBalance.add(oldAmount).subtract(newAmount)
            );
            accountRepository.save(account);
        }

        existingExpense.setAmount(newAmount);
        existingExpense.setDescription(details.getDescription());
        existingExpense.setDateSpent(details.getDateSpent());
        existingExpense.setPaymentMethod(details.getPaymentMethod());

        return expenseRepository.save(existingExpense);
    }

    // =================== DELETE ===================
    @Transactional
    public void deleteExpense(Integer id) {

        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Expense not found with ID: " + id
                ));

        // Reverse balance on delete
        if (expense.getAccount() != null) {
            Account account = accountRepository
                    .findById(expense.getAccount().getAccountId())
                    .orElseThrow(() -> new RuntimeException(
                            "Account not found"
                    ));

            BigDecimal currentBalance = account.getCurrentBalance() != null
                    ? account.getCurrentBalance()
                    : BigDecimal.ZERO;

            account.setCurrentBalance(
                    currentBalance.add(expense.getAmount())
            );
            accountRepository.save(account);
        }

        // Reverse budget spent
        if (expense.getUser() != null
                && expense.getCategory() != null
                && expense.getDateSpent() != null) {

            String monthYear = expense.getDateSpent()
                    .format(DateTimeFormatter.ofPattern("yyyy-MM"));

            List<Budget> budgets = budgetRepository
                    .findByUserUserIdAndMonthYear(
                            expense.getUser().getUserId(), monthYear
                    );

            for (Budget budget : budgets) {
                if (budget.getCategory().getCategoryId()
                        .equals(expense.getCategory().getCategoryId())) {

                    BigDecimal spent = budget.getAmountSpent() != null
                            ? budget.getAmountSpent()
                            : BigDecimal.ZERO;

                    budget.setAmountSpent(
                            spent.subtract(expense.getAmount()).max(BigDecimal.ZERO)
                    );
                    budgetRepository.save(budget);
                }
            }
        }

        expenseRepository.deleteById(id);
    }
}