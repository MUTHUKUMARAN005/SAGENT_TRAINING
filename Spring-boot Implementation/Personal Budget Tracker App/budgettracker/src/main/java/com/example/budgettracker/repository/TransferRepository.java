package com.example.budgettracker.repository;

import com.example.budgettracker.model.Transfer;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransferRepository extends JpaRepository<Transfer, Integer> {

    @Query("SELECT t FROM Transfer t " +
            "WHERE t.fromAccount.accountId = :accountId " +
            "OR t.toAccount.accountId = :accountId")
    List<Transfer> findByAccountId(@Param("accountId") Integer accountId);

    @Query("SELECT t FROM Transfer t " +
            "WHERE t.fromAccount.user.userId = :userId " +
            "OR t.toAccount.user.userId = :userId")
    List<Transfer> findByUserId(@Param("userId") Integer userId);
}