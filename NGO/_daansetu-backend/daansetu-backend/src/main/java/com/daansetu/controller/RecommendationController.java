// src/main/java/com/daansetu/controller/RecommendationController.java
package com.daansetu.controller;

import com.daansetu.dto.response.ApiResponse;
import com.daansetu.dto.response.RecommendationResponse;
import com.daansetu.entity.User;
import com.daansetu.repository.UserRepository;
import com.daansetu.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserRepository userRepository;

    /**
     * GET /api/recommendations
     * Returns AI-scored campaign recommendations for the authenticated donor.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<RecommendationResponse>>> getRecommendations(
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        List<RecommendationResponse> recs = recommendationService.getRecommendations(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(recs));
    }
}

