package com.daansetu.controller;

import com.daansetu.dto.request.AdminDonationPaymentStatusRequest;
import com.daansetu.dto.response.ApiResponse;
import com.daansetu.dto.response.DonationResponse;
import com.daansetu.dto.response.PageResponse;
import com.daansetu.enums.DonationType;
import com.daansetu.service.DonationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/admin/donations")
@RequiredArgsConstructor
public class AdminDonationController {

    private final DonationService donationService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<DonationResponse>>> getAllDonations(
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

    @PutMapping("/{donationId}/payment-status")
    public ResponseEntity<ApiResponse<DonationResponse>> updateDonationPaymentStatus(
            @PathVariable Long donationId,
            @Valid @RequestBody AdminDonationPaymentStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Donation payment status updated",
                donationService.updateDonationPaymentStatusForAdmin(donationId, request.getPaymentStatus())
        ));
    }

    @PostMapping("/{donationId}/receipt")
    public ResponseEntity<ApiResponse<DonationResponse>> generateDonationReceipt(@PathVariable Long donationId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Donation receipt generated",
                donationService.generateDonationReceiptForAdmin(donationId)
        ));
    }
}
