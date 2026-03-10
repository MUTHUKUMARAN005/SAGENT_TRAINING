package com.example.budgettracker.service;

import com.example.budgettracker.model.Account;
import com.example.budgettracker.model.User;
import com.example.budgettracker.repository.AccountRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public Optional<Account> getAccountById(Integer id) {
        return accountRepository.findById(id);
    }

    public List<Account> getAccountsByUserId(Integer userId) {
        return accountRepository.findByUserUserId(userId);
    }

    public BigDecimal getTotalBalance(Integer userId) {
        return accountRepository.getTotalBalanceByUserId(userId);
    }

    public Account createAccount(Account account) {
        // Set current balance to initial balance if not provided
        if (account.getCurrentBalance() == null) {
            account.setCurrentBalance(
                    account.getInitialBalance() != null
                            ? account.getInitialBalance()
                            : BigDecimal.ZERO
            );
        }
        return accountRepository.save(account);
    }

    public Account updateAccount(Integer id, Account details) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Account not found with ID: " + id
                ));

        account.setAccountName(details.getAccountName());
        account.setAccountType(details.getAccountType());
        account.setCurrentBalance(details.getCurrentBalance());
        account.setIsActive(details.getIsActive());

        return accountRepository.save(account);
    }

    public void deleteAccount(Integer id) {
        if (!accountRepository.existsById(id)) {
            throw new RuntimeException("Account not found with ID: " + id);
        }
        accountRepository.deleteById(id);
    }
}