// src/main/java/com/daansetu/repository/DonationItemRepository.java
package com.daansetu.repository;

import com.daansetu.entity.DonationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DonationItemRepository extends JpaRepository<DonationItem, Long> {
    List<DonationItem> findByDonationDonationId(Long donationId);
    void deleteByDonationUserUserId(Long userId);
}