// src/main/java/com/daansetu/repository/PaymentRepository.java
package com.daansetu.repository;

import com.daansetu.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByTransactionId(String transactionId);
    Optional<Payment> findByDonationDonationId(Long donationId);
}