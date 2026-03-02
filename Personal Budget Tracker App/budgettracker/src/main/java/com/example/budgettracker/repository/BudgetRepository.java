package com.example.budgettracker.repository;

import com.example.budgettracker.model.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;


@Repository
public interface BudgetRepository extends JpaRepository<Budget, Integer> {

    List<Budget> findByUserUserId(Integer userId);

    List<Budget> findByUserUserIdAndMonthYear(
            Integer userId, String monthYear);
}