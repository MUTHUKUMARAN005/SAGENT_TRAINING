package com.daansetu.controller;

import com.daansetu.dto.request.RatingRequest;
import com.daansetu.dto.response.ApiResponse;
import com.daansetu.entity.User;
import com.daansetu.repository.UserRepository;
import com.daansetu.service.VolunteerRatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ratings")
@RequiredArgsConstructor
public class VolunteerRatingController {

    private final VolunteerRatingService volunteerRatingService;
    private final UserRepository userRepository;

    @PostMapping("/tasks/{taskId}")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitTaskRating(
            @PathVariable Long taskId,
            @Valid @RequestBody RatingRequest request,
            Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();

        return ResponseEntity.ok(ApiResponse.success(
                "Volunteer rating submitted",
                volunteerRatingService.submitRating(taskId, user.getUserId(), request.getStars(), request.getFeedback())
        ));
    }

    @PostMapping("/pickups/{pickupId}")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitPickupRating(
            @PathVariable Long pickupId,
            @Valid @RequestBody RatingRequest request,
            Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();

        return ResponseEntity.ok(ApiResponse.success(
                "Volunteer rating submitted",
                volunteerRatingService.submitRatingByPickup(pickupId, user.getUserId(), request.getStars(), request.getFeedback())
        ));
    }
}
