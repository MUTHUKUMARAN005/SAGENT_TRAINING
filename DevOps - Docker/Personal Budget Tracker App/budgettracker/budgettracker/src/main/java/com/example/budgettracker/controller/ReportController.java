package com.example.budgettracker.controller;

import com.example.budgettracker.model.Report;
import com.example.budgettracker.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping
    public List<Report> getAll() {
        return reportService.getAllReports();
    }

    @GetMapping("/user/{userId}")
    public List<Report> getByUser(@PathVariable Integer userId) {
        return reportService.getReportsByUserId(userId);
    }

    @PostMapping
    public Report create(@RequestBody Report report) {
        return reportService.createReport(report);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }
}