// src/main/java/com/daansetu/repository/VolunteerRepository.java
package com.daansetu.repository;

import com.daansetu.entity.Volunteer;
import com.daansetu.enums.VolunteerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface VolunteerRepository extends JpaRepository<Volunteer, Long> {
    Optional<Volunteer> findByUserUserId(Long userId);
    List<Volunteer> findByNgoEmail(String ngoEmail);
    List<Volunteer> findByNgoEmailAndVolunteerStatus(String ngoEmail, VolunteerStatus status);
    
    @Query("SELECT v FROM Volunteer v WHERE v.ngo.ngoId = :ngoId")
    List<Volunteer> findByNgoId(@Param("ngoId") Long ngoId);
    
    @Query("SELECT v FROM Volunteer v WHERE v.ngo.ngoId = :ngoId AND v.volunteerStatus = :status")
    List<Volunteer> findByNgoIdAndStatus(@Param("ngoId") Long ngoId, @Param("status") VolunteerStatus status);
    
    @Query("SELECT v FROM Volunteer v WHERE v.ngo.email = :ngoEmail ORDER BY v.joinedDate DESC")
    List<Volunteer> findAllByNgoEmailOrderByJoinedDate(@Param("ngoEmail") String ngoEmail);
    
    @Query("SELECT COUNT(v) FROM Volunteer v WHERE v.ngo.ngoId = :ngoId AND v.volunteerStatus = :status")
    long countByNgoIdAndStatus(@Param("ngoId") Long ngoId, @Param("status") VolunteerStatus status);
}
