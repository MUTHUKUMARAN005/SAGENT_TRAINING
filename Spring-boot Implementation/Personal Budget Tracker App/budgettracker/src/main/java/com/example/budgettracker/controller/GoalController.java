package com.example.budgettracker.controller;


import com.example.budgettracker.model.Goal;
import com.example.budgettracker.service.GoalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    @Autowired
    private GoalService goalService;

    @GetMapping
    public List<Goal> getAll() {
        return goalService.getAllGoals();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Goal> getById(@PathVariable Integer id) {
        return goalService.getGoalById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<Goal> getByUser(@PathVariable Integer userId) {
        return goalService.getGoalsByUserId(userId);
    }

    @GetMapping("/user/{userId}/active")
    public List<Goal> getActive(@PathVariable Integer userId) {
        return goalService.getActiveGoals(userId);
    }

    @PostMapping
    public Goal create(@RequestBody Goal goal) {
        return goalService.createGoal(goal);
    }

    @PutMapping("/{id}")
    public Goal update(
            @PathVariable Integer id,
            @RequestBody Goal goal) {
        return goalService.updateGoal(id, goal);
    }

    @PatchMapping("/{id}/contribute")
    public Goal contribute(
            @PathVariable Integer id,
            @RequestParam BigDecimal amount) {
        return goalService.contributeToGoal(id, amount);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        goalService.deleteGoal(id);
        return ResponseEntity.noContent().build();
    }
}