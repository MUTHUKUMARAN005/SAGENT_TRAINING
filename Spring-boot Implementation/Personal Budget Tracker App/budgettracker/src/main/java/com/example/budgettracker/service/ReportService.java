package com.example.budgettracker.service;

import com.example.budgettracker.model.Report;
import com.example.budgettracker.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Service
public class ReportService {

    @Autowired
    private ReportRepository reportRepository;

    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }

    public List<Report> getReportsByUserId(Integer userId) {
        return reportRepository.findByUserUserId(userId);
    }

    public Report createReport(Report report) {
        return reportRepository.save(report);
    }

    public void deleteReport(Integer id) {
        if (!reportRepository.existsById(id)) {
            throw new RuntimeException("Report not found with ID: " + id);
        }
        reportRepository.deleteById(id);
    }
}