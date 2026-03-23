package com.daansetu.controller;

import com.daansetu.dto.response.ApiResponse;
import com.daansetu.entity.User;
import com.daansetu.repository.UserRepository;
import com.daansetu.service.ProofService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ProofController {

    private final ProofService proofService;
    private final UserRepository userRepository;

    @PostMapping("/upload-proof")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadProof(
            @RequestParam("donationId") Long donationId,
            @RequestParam("type") String type,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(
                "Proof uploaded",
                proofService.uploadProof(donationId, type, file, user.getUserId())
        ));
    }

    @GetMapping("/proofs/donation/{donationId}")
    @PreAuthorize("hasAnyRole('DONOR', 'NGO', 'ADMIN', 'VOLUNTEER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDonationProofs(@PathVariable Long donationId) {
        return ResponseEntity.ok(ApiResponse.success(proofService.getProofsByDonation(donationId)));
    }
}
