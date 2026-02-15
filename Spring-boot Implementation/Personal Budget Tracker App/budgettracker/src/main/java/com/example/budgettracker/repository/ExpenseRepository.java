package com.example.budgettracker.repository;

import com.example.budgettracker.model.Expense;
import com.example.budgettracker.model.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Integer> {

    List<Expense> findByUserUserId(Integer userId);

    List<Expense> findByUserUserIdAndDateSpentBetween(
            Integer userId, LocalDate start, LocalDate end);

    List<Expense> findByUserUserIdAndCategoryCategoryId(
            Integer userId, Integer categoryId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) " +
            "FROM Expense e WHERE e.user.userId = :userId")
    BigDecimal getTotalExpenseByUserId(@Param("userId") Integer userId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) " +
            "FROM Expense e WHERE e.user.userId = :userId " +
            "AND e.dateSpent BETWEEN :start AND :end")
    BigDecimal getTotalExpenseByUserIdAndDateRange(
            @Param("userId") Integer userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT e.category.categoryName, SUM(e.amount) " +
            "FROM Expense e WHERE e.user.userId = :userId " +
            "GROUP BY e.category.categoryName")
    List<Object[]> getExpenseByCategoryForUser(
            @Param("userId") Integer userId);
}