// File: src/main/java/com/healthcare/repository/ReportRepository.java
package com.healthcare.repository;

import com.healthcare.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Integer> {
    List<Report> findByGeneratedByUserId(Integer userId);
}