package com.daansetu.repository;

import com.daansetu.entity.VolunteerRating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VolunteerRatingRepository extends JpaRepository<VolunteerRating, Long> {
    boolean existsByTaskAssignmentTaskId(Long taskId);
    List<VolunteerRating> findByVolunteerVolunteerIdOrderByCreatedAtDesc(Long volunteerId);
}
