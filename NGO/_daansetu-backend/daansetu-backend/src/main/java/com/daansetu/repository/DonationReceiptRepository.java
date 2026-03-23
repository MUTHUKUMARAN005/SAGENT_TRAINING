// src/main/java/com/daansetu/repository/DonationReceiptRepository.java
package com.daansetu.repository;

import com.daansetu.entity.DonationReceipt;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DonationReceiptRepository extends JpaRepository<DonationReceipt, Long> {
    @EntityGraph(attributePaths = {
            "donation",
            "donation.user",
            "donation.campaign",
            "donation.campaign.ngo",
            "donation.payment"
    })
    Optional<DonationReceipt> findByReceiptNumber(String receiptNumber);

    @EntityGraph(attributePaths = {
            "donation",
            "donation.user",
            "donation.campaign",
            "donation.campaign.ngo",
            "donation.payment"
    })
    Optional<DonationReceipt> findByDonationDonationId(Long donationId);
}
