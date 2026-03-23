// src/main/java/com/daansetu/controller/DonationController.java
package com.daansetu.controller;

import com.daansetu.dto.request.DonationRequestDTO;
import com.daansetu.dto.response.*;
import com.daansetu.entity.User;
import com.daansetu.enums.DonationType;
import com.daansetu.repository.UserRepository;
import com.daansetu.service.DonationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<DonationResponse>> makeDonation(
            Authentication authentication,
            @Valid @RequestBody DonationRequestDTO request) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        DonationResponse response = donationService.makeDonation(user.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Donation successful", response));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<DonationResponse>>> getMyDonations(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(
                donationService.getDonationsByUser(user.getUserId(), page, size)));
    }

    @GetMapping("/ngo/my")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<PageResponse<DonationResponse>>> getNgoDonations(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(
                donationService.getDonationsByNgoAccess(user.getUserId(), user.getEmail(), page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DONOR', 'NGO')")
    public ResponseEntity<ApiResponse<DonationResponse>> getById(
            Authentication authentication,
            @PathVariable Long id) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(donationService.getDonationByIdForActor(
                id,
                user.getUserId(),
                user.getRole(),
                user.getEmail()
        )));
    }

    /**
     * Backward-compatible admin listing endpoint for deployments where /admin/donations
     * is not available in the running artifact yet.
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<DonationResponse>>> getAllDonationsForAdmin(
            @RequestParam(required = false) DonationType donationType,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                donationService.getAdminDonations(donationType, paymentStatus, dateFrom, dateTo, page, size)
        ));
    }
}
