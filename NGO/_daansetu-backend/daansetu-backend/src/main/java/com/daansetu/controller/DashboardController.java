// src/main/java/com/daansetu/controller/DashboardController.java
package com.daansetu.controller;

import com.daansetu.dto.request.AdminMenuItemRequest;
import com.daansetu.dto.response.AdminMenuItemResponse;
import com.daansetu.dto.response.ApiResponse;
import com.daansetu.dto.response.DashboardStatsResponse;
import com.daansetu.entity.User;
import com.daansetu.repository.UserRepository;
import com.daansetu.service.AdminMenuService;
import com.daansetu.service.DashboardService;
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
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final AdminMenuService adminMenuService;
    private final UserRepository userRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getAdminStats() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getAdminStats()));
    }

    @GetMapping("/ngo/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'NGO')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNGOStats(Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getNGOStats(user.getUserId(), user.getEmail())));
    }

    @GetMapping("/volunteer/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'VOLUNTEER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getVolunteerStats(Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getVolunteerStats(user.getUserId())));
    }

    @GetMapping("/donor/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDonorStats(Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDonorStats(user.getUserId())));
    }

    @GetMapping("/admin/menu")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AdminMenuItemResponse>>> getAdminMenu() {
        return ResponseEntity.ok(ApiResponse.success(adminMenuService.getEnabledMenuItems()));
    }

    @GetMapping("/admin/menu/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AdminMenuItemResponse>>> getAllAdminMenu() {
        return ResponseEntity.ok(ApiResponse.success(adminMenuService.getAllMenuItems()));
    }

    @PostMapping("/admin/menu")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminMenuItemResponse>> createAdminMenuItem(
            @Valid @RequestBody AdminMenuItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Menu item created", adminMenuService.createMenuItem(request)));
    }

    @PutMapping("/admin/menu/{menuId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminMenuItemResponse>> updateAdminMenuItem(
            @PathVariable Long menuId,
            @Valid @RequestBody AdminMenuItemRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Menu item updated", adminMenuService.updateMenuItem(menuId, request))
        );
    }

    @DeleteMapping("/admin/menu/{menuId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteAdminMenuItem(@PathVariable Long menuId) {
        adminMenuService.deleteMenuItem(menuId);
        return ResponseEntity.ok(ApiResponse.success("Menu item deleted"));
    }
}
