package com.daansetu.repository;

import com.daansetu.entity.DonationProof;
import com.daansetu.enums.ProofType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DonationProofRepository extends JpaRepository<DonationProof, Long> {
    Optional<DonationProof> findByDonationDonationIdAndType(Long donationId, ProofType type);
    List<DonationProof> findByDonationDonationIdOrderByCreatedAtAsc(Long donationId);
    boolean existsByDonationDonationIdAndType(Long donationId, ProofType type);
}
