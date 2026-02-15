// File: src/main/java/com/healthcare/controller/ReportController.java
package com.healthcare.controller;

import com.healthcare.model.Report;
import com.healthcare.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping
    public ResponseEntity<List<Report>> getAll() {
        return ResponseEntity.ok(reportService.getAll());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Report>> getByUser(@PathVariable Integer userId) {
        return ResponseEntity.ok(reportService.getByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<Report> create(@RequestBody Report report) {
        return ResponseEntity.ok(reportService.save(report));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        reportService.delete(id);
        return ResponseEntity.noContent().build();
    }
}