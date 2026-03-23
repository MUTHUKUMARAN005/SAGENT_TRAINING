package com.daansetu.controller;

import com.daansetu.dto.request.PickupRequestDTO;
import com.daansetu.dto.response.ApiResponse;
import com.daansetu.dto.response.PickupResponse;
import com.daansetu.entity.User;
import com.daansetu.enums.PickupStatus;
import com.daansetu.repository.UserRepository;
import com.daansetu.service.PickupService;
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
@RequestMapping("/pickups")
@RequiredArgsConstructor
public class PickupController {

    private final PickupService pickupService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<PickupResponse>> createPickup(
            @Valid @RequestBody PickupRequestDTO request,
            Authentication authentication) {
        // Log the incoming request for debugging
        System.out.println("=== Pickup Request Received ===");
        System.out.println("Donation ID: " + request.getDonationId());
        System.out.println("Address: " + request.getAddress());
        System.out.println("Pickup Date: " + request.getPickupDate());
        System.out.println("Time Slot: " + request.getTimeSlot());
        System.out.println("Contact Phone: " + request.getContactPhone());
        System.out.println("Notes: " + request.getNotes());
        System.out.println("Latitude: " + request.getLatitude());
        System.out.println("Longitude: " + request.getLongitude());
        System.out.println("Items: " + request.getItems());
        System.out.println("===============================");
        
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pickup request submitted and pending approval", pickupService.createPickupRequest(request, user.getUserId())));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<PickupResponse>>> getMyPickups(Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(pickupService.getPickupsByUser(user.getUserId())));
    }

    @GetMapping("/ngo")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<List<PickupResponse>>> getNgoPickups(
            Authentication authentication,
            @RequestParam(required = false) PickupStatus status) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(pickupService.getPickupsByNgoAccess(user.getUserId(), user.getEmail(), status)));
    }

    @GetMapping("/ngo/volunteers")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getNgoVolunteers(Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(pickupService.getNgoVolunteers(user.getEmail())));
    }

    @PutMapping("/ngo/{id}/decision")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<PickupResponse>> decideNgoPickup(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam String decision) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(
            pickupService.decidePickupForNgo(id, user.getUserId(), user.getEmail(), decision)
        ));
    }

    @PutMapping("/ngo/{id}/assign")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<PickupResponse>> assignNgoPickup(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam Long volunteerId,
            @RequestParam(required = false) String description) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(
            pickupService.assignVolunteerForNgo(id, user.getUserId(), user.getEmail(), volunteerId, description)
        ));
    }

    @PutMapping("/admin/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PickupResponse>> assignAdminPickup(
            @PathVariable Long id,
            @RequestParam Long volunteerId,
            @RequestParam(required = false) String description) {
        return ResponseEntity.ok(ApiResponse.success(
                pickupService.assignVolunteerAsAdmin(id, volunteerId, description)
        ));
    }

    @PutMapping("/ngo/{id}/status")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<PickupResponse>> updateNgoPickupStatus(
            Authentication authentication,
            @PathVariable Long id,
            @RequestParam PickupStatus status) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(
            pickupService.updatePickupStatusForNgo(id, user.getUserId(), user.getEmail(), status)
        ));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VOLUNTEER')")
    public ResponseEntity<ApiResponse<List<PickupResponse>>> getByStatus(@PathVariable PickupStatus status) {
        return ResponseEntity.ok(ApiResponse.success(pickupService.getPickupsByStatus(status)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'VOLUNTEER')")
    public ResponseEntity<ApiResponse<PickupResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam PickupStatus status) {
        return ResponseEntity.ok(ApiResponse.success(pickupService.updatePickupStatus(id, status)));
    }
}
