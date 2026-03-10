package com.example.budgettracker.controller;

import com.example.budgettracker.model.Account;

import com.example.budgettracker.service.AccountService;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    @Autowired
    private AccountService accountService;

    @GetMapping
    public List<Account> getAll() {
        return accountService.getAllAccounts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> getById(@PathVariable Integer id) {
        return accountService.getAccountById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<Account> getByUser(@PathVariable Integer userId) {
        return accountService.getAccountsByUserId(userId);
    }

    @GetMapping("/user/{userId}/balance")
    public BigDecimal getTotalBalance(@PathVariable Integer userId) {
        return accountService.getTotalBalance(userId);
    }

    @PostMapping
    public Account create(@RequestBody Account account) {
        return accountService.createAccount(account);
    }

    @PutMapping("/{id}")
    public Account update(
            @PathVariable Integer id,
            @RequestBody Account account) {
        return accountService.updateAccount(id, account);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        accountService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }
}