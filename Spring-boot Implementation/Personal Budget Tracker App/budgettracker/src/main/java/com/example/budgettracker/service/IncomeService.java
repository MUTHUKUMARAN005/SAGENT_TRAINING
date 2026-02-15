package com.example.budgettracker.service;

import com.example.budgettracker.model.Account;
import com.example.budgettracker.model.Income;
import com.example.budgettracker.repository.AccountRepository;
import com.example.budgettracker.repository.IncomeRepository;

import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import java.math.BigDecimal;


@Service
public class IncomeService {

    @Autowired
    private IncomeRepository incomeRepository;

    @Autowired
    private AccountRepository accountRepository;

    public List<Income> getAllIncomes() {
        return incomeRepository.findAll();
    }

    public Optional<Income> getIncomeById(Integer id) {
        return incomeRepository.findById(id);
    }

    public List<Income> getIncomesByUserId(Integer userId) {
        return incomeRepository.findByUserUserId(userId);
    }

    public BigDecimal getTotalIncome(Integer userId) {
        return incomeRepository.getTotalIncomeByUserId(userId);
    }

    public BigDecimal getTotalIncomeByDateRange(
            Integer userId, LocalDate start, LocalDate end) {
        return incomeRepository
                .getTotalIncomeByUserIdAndDateRange(userId, start, end);
    }

    // =================== CREATE ===================
    @Transactional
    public Income createIncome(Income income) {

        // Step 1: Validate
        if (income.getAmount() == null
                || income.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Income amount must be positive"
            );
        }

        // Step 2: Update account balance FIRST
        if (income.getAccount() != null
                && income.getAccount().getAccountId() != null) {

            Account account = accountRepository
                    .findById(income.getAccount().getAccountId())
                    .orElseThrow(() -> new RuntimeException(
                            "Account not found with ID: "
                                    + income.getAccount().getAccountId()
                    ));

            BigDecimal currentBalance = account.getCurrentBalance() != null
                    ? account.getCurrentBalance()
                    : BigDecimal.ZERO;

            account.setCurrentBalance(currentBalance.add(income.getAmount()));
            accountRepository.save(account);

            // Set fresh account reference
            income.setAccount(account);
        }

        // Step 3: Save income AFTER account update
        return incomeRepository.save(income);
    }

    // =================== UPDATE ===================
    @Transactional
    public Income updateIncome(Integer id, Income details) {

        Income existingIncome = incomeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Income not found with ID: " + id
                ));

        BigDecimal oldAmount = existingIncome.getAmount() != null
                ? existingIncome.getAmount()
                : BigDecimal.ZERO;

        BigDecimal newAmount = details.getAmount() != null
                ? details.getAmount()
                : oldAmount;

        // Adjust account balance if amount changed
        if (oldAmount.compareTo(newAmount) != 0
                && existingIncome.getAccount() != null) {

            Account account = accountRepository
                    .findById(existingIncome.getAccount().getAccountId())
                    .orElseThrow(() -> new RuntimeException(
                            "Account not found"
                    ));

            BigDecimal currentBalance = account.getCurrentBalance() != null
                    ? account.getCurrentBalance()
                    : BigDecimal.ZERO;

            // Remove old amount, add new amount
            account.setCurrentBalance(
                    currentBalance.subtract(oldAmount).add(newAmount)
            );
            accountRepository.save(account);
        }

        existingIncome.setAmount(newAmount);
        existingIncome.setIncomeType(details.getIncomeType());
        existingIncome.setDescription(details.getDescription());
        existingIncome.setDateReceived(details.getDateReceived());
        existingIncome.setIsRecurring(details.getIsRecurring());

        return incomeRepository.save(existingIncome);
    }

    // =================== DELETE ===================
    @Transactional
    public void deleteIncome(Integer id) {

        Income income = incomeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Income not found with ID: " + id
                ));

        // Reverse balance on delete
        if (income.getAccount() != null) {
            Account account = accountRepository
                    .findById(income.getAccount().getAccountId())
                    .orElseThrow(() -> new RuntimeException(
                            "Account not found"
                    ));

            BigDecimal currentBalance = account.getCurrentBalance() != null
                    ? account.getCurrentBalance()
                    : BigDecimal.ZERO;

            account.setCurrentBalance(
                    currentBalance.subtract(income.getAmount())
            );
            accountRepository.save(account);
        }

        incomeRepository.deleteById(id);
    }
}