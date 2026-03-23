package com.daansetu.controller;

import com.daansetu.dto.request.UrgentNeedRequest;
import com.daansetu.dto.response.ApiResponse;
import com.daansetu.dto.response.UrgentNeedResponse;
import com.daansetu.entity.User;
import com.daansetu.repository.UserRepository;
import com.daansetu.service.UrgentNeedService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/urgent-needs")
@RequiredArgsConstructor
public class UrgentNeedController {

    private final UrgentNeedService urgentNeedService;
    private final UserRepository userRepository;

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<UrgentNeedResponse>>> getActiveUrgentNeeds() {
        return ResponseEntity.ok(ApiResponse.success(urgentNeedService.getActiveForHomepage()));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<List<UrgentNeedResponse>>> getMyUrgentNeeds(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(urgentNeedService.getMine(user.getEmail())));
    }

    @PostMapping
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<UrgentNeedResponse>> createUrgentNeed(
            Authentication authentication,
            @Valid @RequestBody UrgentNeedRequest request) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        UrgentNeedResponse created = urgentNeedService.createForNgo(user.getEmail(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Urgent need created", created));
    }

    @PutMapping("/{urgentId}")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<UrgentNeedResponse>> updateUrgentNeed(
            Authentication authentication,
            @PathVariable Long urgentId,
            @Valid @RequestBody UrgentNeedRequest request) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        UrgentNeedResponse updated = urgentNeedService.updateForNgo(user.getEmail(), urgentId, request);
        return ResponseEntity.ok(ApiResponse.success("Urgent need updated", updated));
    }

    @DeleteMapping("/{urgentId}")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<String>> deleteUrgentNeed(
            Authentication authentication,
            @PathVariable Long urgentId) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        urgentNeedService.deleteForNgo(user.getEmail(), urgentId);
        return ResponseEntity.ok(ApiResponse.success("Urgent need deleted"));
    }
}
