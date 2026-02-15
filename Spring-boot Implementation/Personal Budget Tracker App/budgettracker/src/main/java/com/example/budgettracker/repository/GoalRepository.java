package com.example.budgettracker.repository;

import com.example.budgettracker.model.Category;
import com.example.budgettracker.model.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GoalRepository extends JpaRepository<Goal, Integer> {
    List<Goal> findByUserUserId(Integer userId);
    List<Goal> findByUserUserIdAndStatus(Integer userId, String status);
}