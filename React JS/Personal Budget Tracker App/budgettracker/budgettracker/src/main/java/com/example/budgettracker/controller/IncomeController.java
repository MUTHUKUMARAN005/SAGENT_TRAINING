package com.example.budgettracker.controller;

import com.example.budgettracker.model.Account;

import com.example.budgettracker.model.Income;
import com.example.budgettracker.service.AccountService;

import com.example.budgettracker.service.IncomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/incomes")
public class IncomeController {

    @Autowired
    private IncomeService incomeService;

    @GetMapping
    public List<Income> getAll() {
        return incomeService.getAllIncomes();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Income> getById(@PathVariable Integer id) {
        return incomeService.getIncomeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<Income> getByUser(@PathVariable Integer userId) {
        return incomeService.getIncomesByUserId(userId);
    }

    @GetMapping("/user/{userId}/total")
    public BigDecimal getTotal(@PathVariable Integer userId) {
        return incomeService.getTotalIncome(userId);
    }

    @PostMapping
    public Income create(@RequestBody Income income) {
        return incomeService.createIncome(income);
    }

    @PutMapping("/{id}")
    public Income update(
            @PathVariable Integer id,
            @RequestBody Income income) {
        return incomeService.updateIncome(id, income);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        incomeService.deleteIncome(id);
        return ResponseEntity.noContent().build();
    }
}