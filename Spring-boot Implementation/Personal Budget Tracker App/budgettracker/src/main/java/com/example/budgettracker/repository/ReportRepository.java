package com.example.budgettracker.repository;

import com.example.budgettracker.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {

    List<Report> findByUserUserId(Integer userId);

    List<Report> findByUserUserIdAndReportType(
            Integer userId, String reportType);
}