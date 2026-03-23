package com.daansetu.service;

import com.daansetu.entity.Donation;
import com.daansetu.entity.TaskAssignment;
import com.daansetu.entity.Volunteer;
import com.daansetu.entity.VolunteerRating;
import com.daansetu.entity.User;
import com.daansetu.enums.TaskStatus;
import com.daansetu.exception.BadRequestException;
import com.daansetu.exception.ResourceNotFoundException;
import com.daansetu.repository.TaskAssignmentRepository;
import com.daansetu.repository.UserRepository;
import com.daansetu.repository.VolunteerRatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VolunteerRatingService {

    private final VolunteerRatingRepository ratingRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final UserRepository userRepository;

    @Transactional
    public Map<String, Object> submitRating(Long taskId, Long donorUserId, Integer stars, String feedback) {
        if (stars == null || stars < 1 || stars > 5) {
            throw new BadRequestException("Rating must be between 1 and 5 stars");
        }

        TaskAssignment task = taskAssignmentRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

        Donation donation = task.getPickupRequest() != null ? task.getPickupRequest().getDonation() : null;
        if (donation == null || donation.getUser() == null || donation.getUser().getUserId() == null) {
            throw new BadRequestException("Task is not linked to a valid donor donation");
        }

        if (!donorUserId.equals(donation.getUser().getUserId())) {
            throw new BadRequestException("Only the donor can rate the volunteer for this task");
        }

        if (task.getTaskStatus() != TaskStatus.COMPLETED) {
            throw new BadRequestException("You can rate only after delivery is completed");
        }

        if (ratingRepository.existsByTaskAssignmentTaskId(taskId)) {
            throw new BadRequestException("You have already rated this delivery");
        }

        User donor = userRepository.findById(donorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", donorUserId));

        Volunteer volunteer = task.getVolunteer();
        if (volunteer == null || volunteer.getVolunteerId() == null) {
            throw new BadRequestException("Task is not linked to a valid volunteer");
        }

        VolunteerRating rating = VolunteerRating.builder()
                .taskAssignment(task)
                .donation(donation)
                .donor(donor)
                .volunteer(volunteer)
                .stars(stars)
                .feedback(feedback != null ? feedback.trim() : null)
                .build();

        rating = ratingRepository.save(rating);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("ratingId", rating.getId());
        payload.put("taskId", taskId);
        payload.put("donationId", donation.getDonationId());
        payload.put("volunteerId", volunteer.getVolunteerId());
        payload.put("stars", rating.getStars());
        payload.put("feedback", rating.getFeedback());
        payload.put("createdAt", rating.getCreatedAt());
        return payload;
    }

    @Transactional
    public Map<String, Object> submitRatingByPickup(Long pickupId, Long donorUserId, Integer stars, String feedback) {
        TaskAssignment task = taskAssignmentRepository.findTopByPickupRequestPickupIdOrderByAssignedDateDesc(pickupId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "pickupId", pickupId));

        return submitRating(task.getTaskId(), donorUserId, stars, feedback);
    }
}
