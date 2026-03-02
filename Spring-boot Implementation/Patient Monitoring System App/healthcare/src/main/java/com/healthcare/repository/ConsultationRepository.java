// File: src/main/java/com/healthcare/repository/ConsultationRepository.java
package com.healthcare.repository;

import com.healthcare.model.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsultationRepository extends JpaRepository<Consultation, Integer> {
}