package com.example.budgettracker.service;

import com.example.budgettracker.model.Goal;

import com.example.budgettracker.repository.GoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class GoalService {

    @Autowired
    private GoalRepository goalRepository;

    public List<Goal> getAllGoals() {
        return goalRepository.findAll();
    }

    public Optional<Goal> getGoalById(Integer id) {
        return goalRepository.findById(id);
    }

    public List<Goal> getGoalsByUserId(Integer userId) {
        return goalRepository.findByUserUserId(userId);
    }

    public List<Goal> getActiveGoals(Integer userId) {
        return goalRepository.findByUserUserIdAndStatus(userId, "ACTIVE");
    }

    public Goal createGoal(Goal goal) {
        if (goal.getCurrentAmount() == null) {
            goal.setCurrentAmount(BigDecimal.ZERO);
        }
        return goalRepository.save(goal);
    }

    public Goal updateGoal(Integer id, Goal details) {
        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Goal not found with ID: " + id
                ));

        goal.setGoalName(details.getGoalName());
        goal.setTargetAmount(details.getTargetAmount());
        goal.setCurrentAmount(details.getCurrentAmount());
        goal.setTargetDate(details.getTargetDate());
        goal.setStatus(details.getStatus());

        return goalRepository.save(goal);
    }

    @Transactional
    public Goal contributeToGoal(Integer id, BigDecimal amount) {

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Contribution amount must be positive"
            );
        }

        Goal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Goal not found with ID: " + id
                ));

        BigDecimal currentAmount = goal.getCurrentAmount() != null
                ? goal.getCurrentAmount()
                : BigDecimal.ZERO;

        goal.setCurrentAmount(currentAmount.add(amount));

        // Auto-complete if target reached
        if (goal.getCurrentAmount().compareTo(goal.getTargetAmount()) >= 0) {
            goal.setStatus("COMPLETED");
        }

        return goalRepository.save(goal);
    }

    public void deleteGoal(Integer id) {
        if (!goalRepository.existsById(id)) {
            throw new RuntimeException("Goal not found with ID: " + id);
        }
        goalRepository.deleteById(id);
    }
}