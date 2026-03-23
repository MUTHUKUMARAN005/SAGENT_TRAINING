// src/main/java/com/daansetu/controller/CampaignController.java
package com.daansetu.controller;

import com.daansetu.dto.request.CampaignRequest;
import com.daansetu.dto.response.*;
import com.daansetu.entity.User;
import com.daansetu.enums.CampaignStatus;
import com.daansetu.enums.UserRole;
import com.daansetu.repository.UserRepository;
import com.daansetu.service.CampaignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CampaignResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sort) {
        return ResponseEntity.ok(ApiResponse.success(
                campaignService.getAllCampaigns(page, size, search, status, sort)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CampaignResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(campaignService.getCampaignById(id)));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<CampaignResponse>>> getFeatured() {
        return ResponseEntity.ok(ApiResponse.success(campaignService.getFeaturedCampaigns()));
    }

    /** NGO: list campaigns that belong to the authenticated NGO user */
    @GetMapping("/my")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<PageResponse<CampaignResponse>>> getMyCampaigns(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(
                campaignService.getCampaignsByUser(user.getUserId(), page, size)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'NGO')")
    public ResponseEntity<ApiResponse<CampaignResponse>> create(
            Authentication authentication,
            @Valid @RequestBody CampaignRequest request) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Campaign created",
                        campaignService.createCampaign(request, user.getEmail(), isAdmin)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'NGO')")
    public ResponseEntity<ApiResponse<CampaignResponse>> update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CampaignRequest request) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        return ResponseEntity.ok(ApiResponse.success("Campaign updated",
                campaignService.updateCampaign(id, request, user.getEmail(), isAdmin)));
    }

    /** Admin: change campaign status (ACTIVE / COMPLETED / INACTIVE) */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CampaignResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam CampaignStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Status updated",
                campaignService.updateCampaignStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'NGO')")
    public ResponseEntity<ApiResponse<String>> delete(
            Authentication authentication,
            @PathVariable Long id) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        campaignService.deleteCampaign(id, user.getEmail(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Campaign deleted"));
    }

    @GetMapping("/{id}/updates")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCampaignUpdates(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(campaignService.getCampaignUpdates(id)));
    }

    @PostMapping("/{id}/updates")
    @PreAuthorize("hasAnyRole('ADMIN', 'NGO')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createCampaignUpdate(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Campaign update created",
                        campaignService.createCampaignUpdate(id, request, user.getEmail(), isAdmin)));
    }

    @PutMapping("/{id}/updates/{updateId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'NGO')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateCampaignUpdate(
            Authentication authentication,
            @PathVariable Long id,
            @PathVariable Long updateId,
            @RequestBody Map<String, Object> request) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        return ResponseEntity.ok(ApiResponse.success("Campaign update edited",
                campaignService.updateCampaignUpdate(id, updateId, request, user.getEmail(), isAdmin)));
    }

    @DeleteMapping("/{id}/updates/{updateId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'NGO')")
    public ResponseEntity<ApiResponse<String>> deleteCampaignUpdate(
            Authentication authentication,
            @PathVariable Long id,
            @PathVariable Long updateId) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        campaignService.deleteCampaignUpdate(id, updateId, user.getEmail(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Campaign update deleted"));
    }

    @PutMapping("/{id}/updates/{updateId}/pin")
    @PreAuthorize("hasAnyRole('ADMIN', 'NGO')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> setCampaignUpdatePinned(
            Authentication authentication,
            @PathVariable Long id,
            @PathVariable Long updateId,
            @RequestBody(required = false) Map<String, Object> body) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        boolean pinned = body != null && Boolean.parseBoolean(String.valueOf(body.getOrDefault("pinned", true)));
        return ResponseEntity.ok(ApiResponse.success("Campaign update pin state changed",
                campaignService.setCampaignUpdatePinned(id, updateId, pinned, user.getEmail(), isAdmin)));
    }

    @PutMapping("/{id}/updates/{updateId}/unpin")
    @PreAuthorize("hasAnyRole('ADMIN', 'NGO')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> unpinCampaignUpdate(
            Authentication authentication,
            @PathVariable Long id,
            @PathVariable Long updateId) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        return ResponseEntity.ok(ApiResponse.success("Campaign update pin state changed",
                campaignService.setCampaignUpdatePinned(id, updateId, false, user.getEmail(), isAdmin)));
    }

    @GetMapping("/{id}/volunteers/leaderboard")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCampaignVolunteerLeaderboard(
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(ApiResponse.success(campaignService.getVolunteerLeaderboard(id, limit)));
    }
}
