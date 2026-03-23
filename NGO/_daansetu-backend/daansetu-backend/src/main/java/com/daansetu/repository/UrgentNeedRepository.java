// src/main/java/com/daansetu/repository/UrgentNeedRepository.java
package com.daansetu.repository;

import com.daansetu.entity.UrgentNeed;
import com.daansetu.entity.User;
import com.daansetu.enums.UrgentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface UrgentNeedRepository extends JpaRepository<UrgentNeed, Long> {
    List<UrgentNeed> findByUrgentStatusOrderByCreatedAtDesc(UrgentStatus status);

    List<UrgentNeed> findByAdminOrderByCreatedAtDesc(User admin);

    @Query("SELECT u FROM UrgentNeed u WHERE u.urgentStatus = :status " +
            "AND (u.startTime IS NULL OR u.startTime <= :now) " +
            "AND (u.endTime IS NULL OR u.endTime >= :now) " +
            "ORDER BY u.createdAt DESC")
    List<UrgentNeed> findActiveForHomepage(@Param("status") UrgentStatus status, @Param("now") LocalDateTime now);
}