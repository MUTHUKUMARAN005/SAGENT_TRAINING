// File: src/main/java/com/healthcare/repository/PatientRepository.java
package com.healthcare.repository;

import com.healthcare.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Integer> {
}