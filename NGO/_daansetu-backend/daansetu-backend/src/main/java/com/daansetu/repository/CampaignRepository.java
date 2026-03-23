// src/main/java/com/daansetu/repository/CampaignRepository.java
package com.daansetu.repository;

import com.daansetu.entity.Campaign;
import com.daansetu.enums.CampaignStatus;
import com.daansetu.enums.DonationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    @EntityGraph(attributePaths = {"ngo"})
    Page<Campaign> findByCampaignStatus(CampaignStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"ngo"})
    Page<Campaign> findByNgoNgoId(Long ngoId, Pageable pageable);

    @EntityGraph(attributePaths = {"ngo"})
    @Query("""
            SELECT c
            FROM Campaign c
            WHERE c.admin.userId = :accessUserId
               OR LOWER(COALESCE(c.ngo.email, '')) = LOWER(:accessEmail)
               OR LOWER(COALESCE(c.admin.email, '')) = LOWER(:accessEmail)
            """)
    Page<Campaign> findByNgoAccessContext(@Param("accessUserId") Long accessUserId,
                                          @Param("accessEmail") String accessEmail,
                                          Pageable pageable);

    @EntityGraph(attributePaths = {"ngo"})
    @Query("""
            SELECT c
            FROM Campaign c
            WHERE c.admin.userId = :accessUserId
               OR LOWER(COALESCE(c.ngo.email, '')) = LOWER(:accessEmail)
               OR LOWER(COALESCE(c.admin.email, '')) = LOWER(:accessEmail)
            """)
    List<Campaign> findAllByNgoAccessContext(@Param("accessUserId") Long accessUserId,
                                             @Param("accessEmail") String accessEmail);

    @EntityGraph(attributePaths = {"ngo"})
    Page<Campaign> findByDonationType(DonationType type, Pageable pageable);

    long countByCampaignStatus(CampaignStatus status);

    @EntityGraph(attributePaths = {"ngo"})
    List<Campaign> findTop6ByCampaignStatusOrderByCollectedAmountDesc(CampaignStatus status);

    @Override
    @EntityGraph(attributePaths = {"ngo"})
    Optional<Campaign> findById(Long id);

    @EntityGraph(attributePaths = {"ngo"})
    @Query("SELECT c FROM Campaign c WHERE c.campaignStatus = :status AND " +
            "(LOWER(c.title) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
            "LOWER(c.ngo.ngoName) LIKE LOWER(CONCAT('%',:search,'%')) OR " +
            "LOWER(c.city) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<Campaign> searchCampaigns(@Param("status") CampaignStatus status,
                                   @Param("search") String search, Pageable pageable);
}
