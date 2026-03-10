package com.example.budgettracker.controller;

import com.example.budgettracker.model.Budget;
import com.example.budgettracker.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    @GetMapping
    public List<Budget> getAll() {
        return budgetService.getAllBudgets();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Budget> getById(@PathVariable Integer id) {
        return budgetService.getBudgetById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<Budget> getByUser(@PathVariable Integer userId) {
        return budgetService.getBudgetsByUserId(userId);
    }

    @GetMapping("/user/{userId}/month/{monthYear}")
    public List<Budget> getByMonth(
            @PathVariable Integer userId,
            @PathVariable String monthYear) {
        return budgetService.getBudgetsByUserAndMonth(userId, monthYear);
    }

    @PostMapping
    public Budget create(@RequestBody Budget budget) {
        return budgetService.createBudget(budget);
    }

    @PutMapping("/{id}")
    public Budget update(
            @PathVariable Integer id, @RequestBody Budget budget) {
        return budgetService.updateBudget(id, budget);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.noContent().build();
    }
}