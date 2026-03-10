package com.example.budgettracker.controller;

import com.example.budgettracker.model.Category;
import com.example.budgettracker.model.Expense;
import com.example.budgettracker.service.CategoryService;
import com.example.budgettracker.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @GetMapping
    public List<Expense> getAll() {
        return expenseService.getAllExpenses();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Expense> getById(@PathVariable Integer id) {
        return expenseService.getExpenseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<Expense> getByUser(@PathVariable Integer userId) {
        return expenseService.getExpensesByUserId(userId);
    }

    @GetMapping("/user/{userId}/total")
    public BigDecimal getTotal(@PathVariable Integer userId) {
        return expenseService.getTotalExpense(userId);
    }

    @GetMapping("/user/{userId}/by-category")
    public List<Map<String, Object>> getByCategory(
            @PathVariable Integer userId) {
        return expenseService.getExpenseByCategory(userId);
    }

    @PostMapping
    public Expense create(@RequestBody Expense expense) {
        return expenseService.createExpense(expense);
    }

    @PutMapping("/{id}")
    public Expense update(
            @PathVariable Integer id,
            @RequestBody Expense expense) {
        return expenseService.updateExpense(id, expense);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.noContent().build();
    }
}