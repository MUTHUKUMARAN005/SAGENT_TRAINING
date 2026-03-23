// src/main/java/com/daansetu/repository/EmailLogRepository.java
package com.daansetu.repository;

import com.daansetu.entity.EmailLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {
	Optional<EmailLog> findTopByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);
}