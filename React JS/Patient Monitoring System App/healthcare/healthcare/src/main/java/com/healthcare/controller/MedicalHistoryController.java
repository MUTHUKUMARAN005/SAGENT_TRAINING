// File: src/main/java/com/healthcare/controller/MedicalHistoryController.java
package com.healthcare.controller;

import com.healthcare.model.MedicalHistory;
import com.healthcare.service.MedicalHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-history")
@RequiredArgsConstructor
public class MedicalHistoryController {

    private final MedicalHistoryService service;

    @GetMapping
    public ResponseEntity<List<MedicalHistory>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<MedicalHistory>> getByPatient(@PathVariable Integer patientId) {
        return ResponseEntity.ok(service.getByPatientId(patientId));
    }

    @PostMapping
    public ResponseEntity<MedicalHistory> create(@RequestBody MedicalHistory history) {
        return ResponseEntity.ok(service.save(history));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}