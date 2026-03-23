// src/main/java/com/daansetu/repository/SmsLogRepository.java
package com.daansetu.repository;

import com.daansetu.entity.SmsLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SmsLogRepository extends JpaRepository<SmsLog, Long> {
	Optional<SmsLog> findTopByPhoneNumberOrderByCreatedAtDesc(String phoneNumber);

	Optional<SmsLog> findTopByPhoneNumberEndingWithOrderByCreatedAtDesc(String phoneNumberSuffix);
}