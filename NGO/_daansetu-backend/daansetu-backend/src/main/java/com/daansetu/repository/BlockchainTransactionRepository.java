// src/main/java/com/daansetu/repository/BlockchainTransactionRepository.java
package com.daansetu.repository;

import com.daansetu.entity.BlockchainTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BlockchainTransactionRepository extends JpaRepository<BlockchainTransaction, Long> {
    Optional<BlockchainTransaction> findByDonationDonationId(Long donationId);
    Optional<BlockchainTransaction> findByTxHash(String txHash);
}