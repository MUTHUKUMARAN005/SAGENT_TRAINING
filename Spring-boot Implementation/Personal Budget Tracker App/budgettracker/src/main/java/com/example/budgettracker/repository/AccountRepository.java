package com.example.budgettracker.repository;
import com.example.budgettracker.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface AccountRepository extends JpaRepository<Account, Integer> {

    List<Account> findByUserUserId(Integer userId);

    List<Account> findByUserUserIdAndIsActive(Integer userId, Boolean isActive);

    @Query("SELECT COALESCE(SUM(a.currentBalance), 0) " +
            "FROM Account a WHERE a.user.userId = :userId")
    BigDecimal getTotalBalanceByUserId(@Param("userId") Integer userId);
}