package com.example.budgettracker.repository;

import com.example.budgettracker.model.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface RecurringTransactionRepository
        extends JpaRepository<RecurringTransaction, Integer> {

    List<RecurringTransaction> findByUserUserId(Integer userId);

    List<RecurringTransaction> findByUserUserIdAndIsActive(
            Integer userId, Boolean isActive);

    List<RecurringTransaction> findByNextDateBeforeAndIsActive(
            LocalDate date, Boolean isActive);
}