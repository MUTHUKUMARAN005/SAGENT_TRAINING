// File: src/main/java/com/healthcare/service/MedicalHistoryService.java
package com.healthcare.service;

import com.healthcare.model.MedicalHistory;
import com.healthcare.repository.MedicalHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalHistoryService {
    private final MedicalHistoryRepository repository;

    public List<MedicalHistory> getAll() { return repository.findAll(); }

    public List<MedicalHistory> getByPatientId(Integer patientId) {
        return repository.findByPatientPatientId(patientId);
    }

    public MedicalHistory save(MedicalHistory history) {
        return repository.save(history);
    }

    public void delete(Integer id) { repository.deleteById(id); }
}