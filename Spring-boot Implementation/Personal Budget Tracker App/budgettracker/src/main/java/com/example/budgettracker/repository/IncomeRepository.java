package com.example.budgettracker.repository;

import com.example.budgettracker.model.Category;
import com.example.budgettracker.model.Income;
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
public interface IncomeRepository extends JpaRepository<Income, Integer> {

    List<Income> findByUserUserId(Integer userId);

    List<Income> findByUserUserIdAndDateReceivedBetween(
            Integer userId, LocalDate start, LocalDate end);

    @Query("SELECT COALESCE(SUM(i.amount), 0) " +
            "FROM Income i WHERE i.user.userId = :userId")
    BigDecimal getTotalIncomeByUserId(@Param("userId") Integer userId);

    @Query("SELECT COALESCE(SUM(i.amount), 0) " +
            "FROM Income i WHERE i.user.userId = :userId " +
            "AND i.dateReceived BETWEEN :start AND :end")
    BigDecimal getTotalIncomeByUserIdAndDateRange(
            @Param("userId") Integer userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);
}