// src/main/java/com/daansetu/controller/BlockchainController.java
package com.daansetu.controller;

import com.daansetu.dto.response.ApiResponse;
import com.daansetu.dto.response.BlockchainResponse;
import com.daansetu.service.BlockchainService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/blockchain")
@RequiredArgsConstructor
public class BlockchainController {

    private final BlockchainService blockchainService;

    @GetMapping("/donation/{donationId}")
    public ResponseEntity<ApiResponse<BlockchainResponse>> getBlockchainData(@PathVariable Long donationId) {
        return ResponseEntity.ok(ApiResponse.success(blockchainService.getBlockchainData(donationId)));
    }
}