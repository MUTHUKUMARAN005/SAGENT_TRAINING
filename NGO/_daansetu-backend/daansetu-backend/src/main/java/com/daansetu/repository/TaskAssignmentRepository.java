// src/main/java/com/daansetu/repository/TaskAssignmentRepository.java
package com.daansetu.repository;

import com.daansetu.entity.TaskAssignment;
import com.daansetu.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {
    List<TaskAssignment> findByVolunteerVolunteerId(Long volunteerId);
    List<TaskAssignment> findByPickupRequestPickupId(Long pickupId);
    Optional<TaskAssignment> findByPickupRequestPickupIdAndVolunteerVolunteerId(Long pickupId, Long volunteerId);
    boolean existsByPickupRequestDonationDonationIdAndVolunteerUserUserId(Long donationId, Long userId);
    Optional<TaskAssignment> findTopByPickupRequestPickupIdOrderByAssignedDateDesc(Long pickupId);
    void deleteByVolunteerUserUserId(Long userId);
    long countByVolunteerVolunteerIdAndTaskStatus(Long volunteerId, TaskStatus taskStatus);
    
    @Query("SELECT t FROM TaskAssignment t WHERE t.volunteer.ngo.email = :ngoEmail ORDER BY t.assignedDate DESC")
    List<TaskAssignment> findByVolunteerNgoEmailOrderByAssignedDate(@Param("ngoEmail") String ngoEmail);
    
    @Query("SELECT t FROM TaskAssignment t WHERE t.volunteer.ngo.email = :ngoEmail AND t.taskStatus = :status")
    List<TaskAssignment> findByVolunteerNgoEmailAndStatus(@Param("ngoEmail") String ngoEmail, @Param("status") TaskStatus status);
    
    @Query("SELECT t FROM TaskAssignment t WHERE t.volunteer.volunteerId = :volunteerId ORDER BY t.assignedDate DESC")
    List<TaskAssignment> findByVolunteerIdOrderByAssignedDate(@Param("volunteerId") Long volunteerId);

        @Query("""
                        SELECT t.volunteer.volunteerId,
                                     t.volunteer.user.name,
                   t.volunteer.user.city,
                                     t.volunteer.user.profileImage,
                                     COUNT(t)
                        FROM TaskAssignment t
                        WHERE t.pickupRequest.donation.campaign.campaignId = :campaignId
                            AND t.taskStatus = com.daansetu.enums.TaskStatus.COMPLETED
                GROUP BY t.volunteer.volunteerId, t.volunteer.user.name, t.volunteer.user.city, t.volunteer.user.profileImage
                        ORDER BY COUNT(t) DESC
                        """)
        List<Object[]> findVolunteerLeaderboardByCampaignId(@Param("campaignId") Long campaignId);
}
