// src/main/java/com/daansetu/repository/PickupRequestRepository.java
package com.daansetu.repository;

import com.daansetu.entity.PickupRequest;
import com.daansetu.enums.PickupStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PickupRequestRepository extends JpaRepository<PickupRequest, Long> {
    List<PickupRequest> findByPickupStatus(PickupStatus status);
    List<PickupRequest> findByPickupStatusIn(Collection<PickupStatus> statuses);
    List<PickupRequest> findByDonationUserUserId(Long userId);
    List<PickupRequest> findByDonationCampaignNgoEmail(String ngoEmail);
    List<PickupRequest> findByDonationCampaignNgoEmailAndPickupStatus(String ngoEmail, PickupStatus status);
    Optional<PickupRequest> findByPickupIdAndDonationCampaignNgoEmail(Long pickupId, String ngoEmail);

        @Query("""
          SELECT p
          FROM PickupRequest p
          WHERE p.donation.campaign.admin.userId = :accessUserId
             OR LOWER(COALESCE(p.donation.campaign.ngo.email, '')) = LOWER(:accessEmail)
             OR LOWER(COALESCE(p.donation.campaign.admin.email, '')) = LOWER(:accessEmail)
          """)
        List<PickupRequest> findByNgoAccessContext(
          @Param("accessUserId") Long accessUserId,
          @Param("accessEmail") String accessEmail
        );

        @Query("""
          SELECT p
          FROM PickupRequest p
          WHERE (
        p.donation.campaign.admin.userId = :accessUserId
        OR LOWER(COALESCE(p.donation.campaign.ngo.email, '')) = LOWER(:accessEmail)
        OR LOWER(COALESCE(p.donation.campaign.admin.email, '')) = LOWER(:accessEmail)
          )
          AND p.pickupStatus = :status
          """)
        List<PickupRequest> findByNgoAccessContextAndPickupStatus(
          @Param("accessUserId") Long accessUserId,
          @Param("accessEmail") String accessEmail,
          @Param("status") PickupStatus status
        );

        @Query("""
          SELECT p
          FROM PickupRequest p
          WHERE p.pickupId = :pickupId
            AND (
        p.donation.campaign.admin.userId = :accessUserId
        OR LOWER(COALESCE(p.donation.campaign.ngo.email, '')) = LOWER(:accessEmail)
        OR LOWER(COALESCE(p.donation.campaign.admin.email, '')) = LOWER(:accessEmail)
            )
          """)
        Optional<PickupRequest> findByPickupIdAndNgoAccessContext(
          @Param("pickupId") Long pickupId,
          @Param("accessUserId") Long accessUserId,
          @Param("accessEmail") String accessEmail
        );

    @Query("""
            SELECT p
            FROM PickupRequest p
            WHERE p.donation.campaign.ngo.email = :ngoEmail
              AND p.pickupStatus IN :statuses
              AND p.pickupDate >= :fromDate
              AND NOT EXISTS (
                  SELECT t.taskId
                  FROM TaskAssignment t
                  WHERE t.pickupRequest = p
              )
            ORDER BY p.pickupDate ASC
            """)
    List<PickupRequest> findAwaitingAssignmentByNgoEmail(
            @Param("ngoEmail") String ngoEmail,
            @Param("statuses") Collection<PickupStatus> statuses,
            @Param("fromDate") LocalDate fromDate
    );
}
