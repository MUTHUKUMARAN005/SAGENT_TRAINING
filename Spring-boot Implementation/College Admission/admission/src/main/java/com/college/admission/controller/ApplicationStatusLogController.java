package com.college.admission.controller;

import com.college.admission.model.ApplicationStatusLog;
import com.college.admission.repository.ApplicationStatusLogRepository;
import com.college.admission.service.ApplicationStatusLogService;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/status-logs")
public class ApplicationStatusLogController {

    @Autowired
    private ApplicationStatusLogService applicationStatusLogService;

    @GetMapping
    public List<ApplicationStatusLog> getAllLogs() {
        return applicationStatusLogService.getAllLogs();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationStatusLog> getLogById(@PathVariable Integer id) {
        return applicationStatusLogService.getLogById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/application/{applicationId}")
    public List<ApplicationStatusLog> getLogsByApplicationId(@PathVariable Integer applicationId) {
        return applicationStatusLogService.getLogsByApplicationId(applicationId);
    }

    @PostMapping
    public ApplicationStatusLog createLog(@RequestBody ApplicationStatusLog log) {
        return applicationStatusLogService.createLog(log);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApplicationStatusLog> updateLog(@PathVariable Integer id,
                                                          @RequestBody ApplicationStatusLog log) {
        return ResponseEntity.ok(applicationStatusLogService.updateLog(id, log));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLog(@PathVariable Integer id) {
        applicationStatusLogService.deleteLog(id);
        return ResponseEntity.noContent().build();
    }
}