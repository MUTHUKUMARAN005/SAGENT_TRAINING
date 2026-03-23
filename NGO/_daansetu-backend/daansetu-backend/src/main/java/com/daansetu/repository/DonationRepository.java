// src/main/java/com/daansetu/repository/DonationRepository.java
package com.daansetu.repository;

import com.daansetu.entity.Donation;
import com.daansetu.entity.User;
import com.daansetu.enums.DonationType;
import com.daansetu.enums.DonationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface DonationRepository extends JpaRepository<Donation, Long> {
    Page<Donation> findByUserUserIdOrderByDonationDateDesc(Long userId, Pageable pageable);

        @Query("""
                        SELECT d
                        FROM Donation d
                        WHERE d.campaign.admin.userId = :accessUserId
                           OR LOWER(COALESCE(d.campaign.ngo.email, '')) = LOWER(:accessEmail)
                           OR LOWER(COALESCE(d.campaign.admin.email, '')) = LOWER(:accessEmail)
                        ORDER BY d.donationDate DESC
                        """)
        Page<Donation> findByNgoAccessContextOrderByDonationDateDesc(
                        @Param("accessUserId") Long accessUserId,
                        @Param("accessEmail") String accessEmail,
                        Pageable pageable
        );

        Page<Donation> findByCampaignNgoNgoIdOrderByDonationDateDesc(Long ngoId, Pageable pageable);

    @Query("""
            SELECT COALESCE(SUM(d.amount), 0)
            FROM Donation d
            WHERE d.donationStatus = 'COMPLETED'
              AND (
                    d.campaign.admin.userId = :accessUserId
                    OR LOWER(COALESCE(d.campaign.ngo.email, '')) = LOWER(:accessEmail)
                    OR LOWER(COALESCE(d.campaign.admin.email, '')) = LOWER(:accessEmail)
                  )
            """)
    BigDecimal sumCompletedAmountByNgoAccessContext(
            @Param("accessUserId") Long accessUserId,
            @Param("accessEmail") String accessEmail
    );

    @Query("""
            SELECT COALESCE(SUM(d.amount), 0)
            FROM Donation d
            WHERE d.donationStatus = 'COMPLETED'
              AND d.campaign.ngo.ngoId = :ngoId
            """)
    BigDecimal sumCompletedAmountByNgoId(@Param("ngoId") Long ngoId);

    @Query("""
            SELECT COUNT(DISTINCT d.user.userId)
            FROM Donation d
            WHERE (
                    d.campaign.admin.userId = :accessUserId
                    OR LOWER(COALESCE(d.campaign.ngo.email, '')) = LOWER(:accessEmail)
                    OR LOWER(COALESCE(d.campaign.admin.email, '')) = LOWER(:accessEmail)
                  )
            """)
    long countDistinctDonorsByNgoAccessContext(
            @Param("accessUserId") Long accessUserId,
            @Param("accessEmail") String accessEmail
    );

    @Query("""
            SELECT COUNT(DISTINCT d.user.userId)
            FROM Donation d
            WHERE d.campaign.ngo.ngoId = :ngoId
            """)
    long countDistinctDonorsByNgoId(@Param("ngoId") Long ngoId);

    Page<Donation> findByCampaignCampaignId(Long campaignId, Pageable pageable);
    List<Donation> findByUserUserIdAndDonationStatus(Long userId, DonationStatus status);
    void deleteByUserUserId(Long userId);

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Donation d WHERE d.donationStatus = 'COMPLETED'")
    BigDecimal getTotalDonations();

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Donation d WHERE d.donationStatus = 'COMPLETED' " +
            "AND d.donationDate >= :startDate")
    BigDecimal getTotalDonationsSince(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Donation d WHERE d.user.userId = :userId " +
            "AND d.donationStatus = 'COMPLETED'")
    BigDecimal getTotalDonationsByUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(DISTINCT d.campaign.campaignId) FROM Donation d WHERE d.user.userId = :userId")
    long countCampaignsByUser(@Param("userId") Long userId);

    @Query("SELECT d FROM Donation d LEFT JOIN d.payment p " +
            "WHERE (:donationType IS NULL OR d.donationType = :donationType) " +
            "AND (:fromDate IS NULL OR d.donationDate >= :fromDate) " +
            "AND (:toDateExclusive IS NULL OR d.donationDate < :toDateExclusive) " +
            "AND (:paymentConfirmed IS NULL OR " +
            "(:paymentConfirmed = TRUE AND p.paymentStatus = com.daansetu.enums.PaymentStatus.SUCCESS) OR " +
            "(:paymentConfirmed = FALSE AND (p IS NULL OR p.paymentStatus <> com.daansetu.enums.PaymentStatus.SUCCESS)))")
    Page<Donation> findAllForAdminFilters(
            @Param("donationType") DonationType donationType,
            @Param("paymentConfirmed") Boolean paymentConfirmed,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDateExclusive") LocalDateTime toDateExclusive,
            Pageable pageable
    );

    @Query("""
            SELECT DISTINCT d.user
            FROM Donation d
            WHERE LOWER(d.campaign.ngo.email) = LOWER(:ngoEmail)
               OR LOWER(d.campaign.admin.email) = LOWER(:ngoEmail)
            """)
    List<User> findDistinctDonorUsersByNgoEmail(@Param("ngoEmail") String ngoEmail);

    @Query("SELECT DISTINCT d.user FROM Donation d WHERE d.campaign.campaignId = :campaignId")
    List<User> findDistinctDonorUsersByCampaignId(@Param("campaignId") Long campaignId);
}
