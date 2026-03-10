// File: src/main/java/com/healthcare/repository/HealthRecordRepository.java
package com.healthcare.repository;

import com.healthcare.model.HealthRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HealthRecordRepository extends JpaRepository<HealthRecord, Integer> {
    List<HealthRecord> findByPatientPatientIdOrderByDateDesc(Integer patientId);
}