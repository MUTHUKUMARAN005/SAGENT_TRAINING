package com.example.budgettracker.repository;

import com.example.budgettracker.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Integer> {

    List<Alert> findByUserUserId(Integer userId);

    List<Alert> findByUserUserIdAndIsRead(Integer userId, Boolean isRead);

    long countByUserUserIdAndIsRead(Integer userId, Boolean isRead);
}