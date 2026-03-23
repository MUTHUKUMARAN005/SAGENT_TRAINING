// src/main/java/com/daansetu/controller/CarbonController.java
package com.daansetu.controller;

import com.daansetu.dto.response.ApiResponse;
import com.daansetu.dto.response.CarbonFootprintResponse;
import com.daansetu.entity.User;
import com.daansetu.repository.UserRepository;
import com.daansetu.service.CarbonFootprintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/carbon")
@RequiredArgsConstructor
public class CarbonController {

    private final CarbonFootprintService carbonService;
    private final UserRepository userRepository;

    @GetMapping("/my-footprint")
    public ResponseEntity<ApiResponse<CarbonFootprintResponse>> getMyFootprint(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(carbonService.calculateFootprint(user.getUserId())));
    }
}