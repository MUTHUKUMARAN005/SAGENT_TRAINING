// File: src/main/java/com/healthcare/repository/MedicalHistoryRepository.java
package com.healthcare.repository;

import com.healthcare.model.MedicalHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedicalHistoryRepository extends JpaRepository<MedicalHistory, Integer> {
    List<MedicalHistory> findByPatientPatientId(Integer patientId);
}