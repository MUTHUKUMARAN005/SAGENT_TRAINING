// File: src/main/java/com/healthcare/controller/HealthRecordController.java
package com.healthcare.controller;

import com.healthcare.model.HealthRecord;
import com.healthcare.service.HealthRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/health-records")
@RequiredArgsConstructor
public class HealthRecordController {

    private final HealthRecordService service;

    @GetMapping
    public ResponseEntity<List<HealthRecord>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<HealthRecord>> getByPatient(@PathVariable Integer patientId) {
        return ResponseEntity.ok(service.getByPatientId(patientId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HealthRecord> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<HealthRecord> create(@RequestBody HealthRecord record) {
        return ResponseEntity.ok(service.save(record));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}