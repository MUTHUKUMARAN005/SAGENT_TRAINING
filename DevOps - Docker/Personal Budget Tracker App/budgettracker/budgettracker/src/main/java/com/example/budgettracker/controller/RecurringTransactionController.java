package com.example.budgettracker.controller;

import com.example.budgettracker.model.RecurringTransaction;
import com.example.budgettracker.service.RecurringTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring")
public class RecurringTransactionController {

    @Autowired
    private RecurringTransactionService service;

    @GetMapping
    public List<RecurringTransaction> getAll() {
        return service.getAllRecurring();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecurringTransaction> getById(
            @PathVariable Integer id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<RecurringTransaction> getByUser(
            @PathVariable Integer userId) {
        return service.getByUserId(userId);
    }

    @GetMapping("/user/{userId}/active")
    public List<RecurringTransaction> getActive(
            @PathVariable Integer userId) {
        return service.getActiveByUserId(userId);
    }

    @PostMapping
    public RecurringTransaction create(
            @RequestBody RecurringTransaction rt) {
        return service.create(rt);
    }

    @PutMapping("/{id}")
    public RecurringTransaction update(
            @PathVariable Integer id,
            @RequestBody RecurringTransaction rt) {
        return service.update(id, rt);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}