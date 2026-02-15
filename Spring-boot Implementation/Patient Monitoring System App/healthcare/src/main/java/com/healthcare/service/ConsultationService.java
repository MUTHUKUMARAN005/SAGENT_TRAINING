// File: src/main/java/com/healthcare/service/ConsultationService.java
package com.healthcare.service;

import com.healthcare.model.Consultation;
import com.healthcare.repository.ConsultationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ConsultationService {
    private final ConsultationRepository repository;

    public List<Consultation> getAll() { return repository.findAll(); }

    public Consultation getById(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Consultation not found"));
    }

    public Consultation save(Consultation consultation) {
        return repository.save(consultation);
    }

    public void delete(Integer id) { repository.deleteById(id); }
}