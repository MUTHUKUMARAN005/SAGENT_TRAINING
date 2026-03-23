// src/main/java/com/daansetu/repository/DonationRequestRepository.java
package com.daansetu.repository;

import com.daansetu.entity.DonationRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DonationRequestRepository extends JpaRepository<DonationRequest, Long> {
	void deleteByUserUserId(Long userId);
}