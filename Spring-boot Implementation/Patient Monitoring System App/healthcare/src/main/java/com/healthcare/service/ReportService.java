// File: src/main/java/com/healthcare/service/ReportService.java
package com.healthcare.service;

import com.healthcare.model.Report;
import com.healthcare.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final ReportRepository repository;

    public List<Report> getAll() { return repository.findAll(); }

    public List<Report> getByUserId(Integer userId) {
        return repository.findByGeneratedByUserId(userId);
    }

    public Report save(Report report) { return repository.save(report); }

    public void delete(Integer id) { repository.deleteById(id); }
}