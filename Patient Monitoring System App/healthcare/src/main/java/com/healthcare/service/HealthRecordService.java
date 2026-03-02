// File: src/main/java/com/healthcare/service/HealthRecordService.java
package com.healthcare.service;

import com.healthcare.model.HealthRecord;
import com.healthcare.repository.HealthRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HealthRecordService {
    private final HealthRecordRepository repository;

    public List<HealthRecord> getAll() { return repository.findAll(); }

    public List<HealthRecord> getByPatientId(Integer patientId) {
        return repository.findByPatientPatientIdOrderByDateDesc(patientId);
    }

    public HealthRecord getById(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Health Record not found"));
    }

    public HealthRecord save(HealthRecord record) {
        return repository.save(record);
    }

    public void delete(Integer id) { repository.deleteById(id); }
}