// src/main/java/com/daansetu/controller/NGOController.java
package com.daansetu.controller;

import com.daansetu.dto.response.ApiResponse;
import com.daansetu.dto.response.NGOResponse;
import com.daansetu.entity.NGO;
import com.daansetu.entity.User;
import com.daansetu.entity.Volunteer;
import com.daansetu.enums.VolunteerStatus;
import com.daansetu.dto.request.VolunteerRequest;
import com.daansetu.repository.NGORepository;
import com.daansetu.repository.UserRepository;
import com.daansetu.service.NGOService;
import com.daansetu.service.VolunteerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ngos")
@RequiredArgsConstructor
public class NGOController {

    private final NGORepository ngoRepository;
    private final UserRepository userRepository;
    private final NGOService ngoService;
    private final VolunteerService volunteerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NGOResponse>>> getAll() {
        List<NGOResponse> ngos = ngoRepository.findByVerifiedTrue().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(ngos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NGOResponse>> getById(@PathVariable Long id) {
        NGO ngo = ngoRepository.findById(id).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(ngo)));
    }

    // ==================== VOLUNTEER MANAGEMENT ENDPOINTS ====================

    @PostMapping("/volunteers/register")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> registerVolunteerForNgo(
            @Valid @RequestBody VolunteerRequest request,
            Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        NGO ngo = resolveOrCreateNgoForUser(user);
        Volunteer volunteer = volunteerService.registerVolunteerForNgo(request.getUserId(), ngo.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Volunteer registered", Map.of(
                "volunteerId", volunteer.getVolunteerId(),
                "userId", volunteer.getUser().getUserId(),
                "ngoId", ngo.getNgoId(),
                "status", volunteer.getVolunteerStatus().name()
        )));
    }

    @GetMapping("/volunteers")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getNGOVolunteers(Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        NGO ngo = resolveOrCreateNgoForUser(user);
        List<Map<String, Object>> volunteers = ngoService.getNGOVolunteersList(ngo.getEmail());
        return ResponseEntity.ok(ApiResponse.success(volunteers));
    }

    @GetMapping("/volunteers/status/{status}")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getVolunteersByStatus(
            @PathVariable String status,
            Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        NGO ngo = resolveOrCreateNgoForUser(user);
        VolunteerStatus volunteerStatus = VolunteerStatus.valueOf(status.toUpperCase());
        List<Map<String, Object>> volunteers = ngoService.getNGOVolunteersByStatus(ngo.getEmail(), volunteerStatus);
        return ResponseEntity.ok(ApiResponse.success(volunteers));
    }

    @GetMapping("/volunteers/{volunteerId}")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getVolunteerDetail(
            @PathVariable Long volunteerId,
            Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        NGO ngo = resolveOrCreateNgoForUser(user);
        Map<String, Object> volunteer = ngoService.getNGOVolunteerDetail(ngo.getEmail(), volunteerId);
        return ResponseEntity.ok(ApiResponse.success(volunteer));
    }

    @PutMapping("/volunteers/{volunteerId}/status")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateVolunteerStatus(
            @PathVariable Long volunteerId,
            @RequestParam("status") String status,
            Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        NGO ngo = resolveOrCreateNgoForUser(user);
        VolunteerStatus volunteerStatus = VolunteerStatus.valueOf(status.toUpperCase());
        Map<String, Object> volunteer = ngoService.updateVolunteerStatus(ngo.getEmail(), volunteerId, volunteerStatus);
        return ResponseEntity.ok(ApiResponse.success("Volunteer status updated", volunteer));
    }

    @GetMapping("/volunteers/stats")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getVolunteerStats(Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        NGO ngo = resolveOrCreateNgoForUser(user);
        Map<String, Object> stats = ngoService.getNGOVolunteerStats(ngo.getEmail());
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/volunteers/schedule/all")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getVolunteerSchedule(Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        NGO ngo = resolveOrCreateNgoForUser(user);
        List<Map<String, Object>> schedule = ngoService.getNGOVolunteerSchedule(ngo.getEmail());
        return ResponseEntity.ok(ApiResponse.success(schedule));
    }

    @GetMapping("/volunteers/{volunteerId}/task-history")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getVolunteerTaskHistory(
            @PathVariable Long volunteerId,
            Authentication authentication) {
        User user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElseThrow();
        NGO ngo = resolveOrCreateNgoForUser(user);
        List<Map<String, Object>> taskHistory = ngoService.getVolunteerTaskHistory(ngo.getEmail(), volunteerId);
        return ResponseEntity.ok(ApiResponse.success(taskHistory));
    }

    private NGO resolveOrCreateNgoForUser(User user) {
        return ngoRepository.findByEmailIgnoreCase(user.getEmail())
                .orElseGet(() -> {
                    String userName = user.getName() != null ? user.getName().trim() : "";
                    if (!userName.isEmpty()) {
                        NGO matchedByName = ngoRepository.findByNgoNameIgnoreCase(userName).stream().findFirst().orElse(null);
                        if (matchedByName != null) {
                            if (matchedByName.getEmail() == null || matchedByName.getEmail().isBlank()) {
                                matchedByName.setEmail(user.getEmail());
                                return ngoRepository.save(matchedByName);
                            }
                            return matchedByName;
                        }
                    }

                    return ngoRepository.save(NGO.builder()
                            .ngoName(!userName.isEmpty() ? userName : "NGO")
                            .email(user.getEmail())
                            .verified(false)
                            .build());
                });
    }

    private NGOResponse mapToResponse(NGO ngo) {
        return NGOResponse.builder()
                .ngoId(ngo.getNgoId())
                .ngoName(ngo.getNgoName())
                .address(ngo.getAddress())
                .city(ngo.getCity())
                .state(ngo.getState())
                .email(ngo.getEmail())
                .phone(ngo.getPhone())
                .description(ngo.getDescription())
                .verified(ngo.isVerified())
                .latitude(ngo.getLatitude())
                .longitude(ngo.getLongitude())
                .activeCampaigns(ngo.getCampaigns().size())
                .build();
    }
}