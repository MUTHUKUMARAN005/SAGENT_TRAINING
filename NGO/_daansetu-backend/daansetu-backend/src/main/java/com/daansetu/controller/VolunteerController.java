package com.daansetu.controller;

import com.daansetu.dto.request.PickupOtpVerifyRequest;
import com.daansetu.dto.request.VolunteerLocationUpdateRequest;
import com.daansetu.dto.request.VolunteerRequest;
import com.daansetu.dto.response.ApiResponse;
import com.daansetu.dto.response.TaskAssignmentResponse;
import com.daansetu.entity.Volunteer;
import com.daansetu.entity.User;
import com.daansetu.repository.UserRepository;
import com.daansetu.service.VolunteerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/volunteers")
@RequiredArgsConstructor
public class VolunteerController {

    private final VolunteerService volunteerService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Object>> register(@Valid @RequestBody VolunteerRequest request) {
        Volunteer volunteer = volunteerService.registerVolunteer(request);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("volunteerId", volunteer.getVolunteerId());
        payload.put("userId", request.getUserId());
        payload.put("ngoId", request.getNgoId());
        payload.put("status", volunteer.getVolunteerStatus());
        payload.put("joinedDate", volunteer.getJoinedDate());
        payload.put("hoursVolunteered", volunteer.getHoursVolunteered());
        payload.put("tasksCompleted", volunteer.getTasksCompleted());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Volunteer registered", payload));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyStats(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(volunteerService.getVolunteerStats(user.getUserId())));
    }

    @GetMapping("/tasks")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyTasks(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(volunteerService.getVolunteerTasks(user.getUserId())));
    }

    @GetMapping("/pickups/awaiting-assignment")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAwaitingAssignmentPickups(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(volunteerService.getAwaitingAssignmentPickups(user.getUserId())));
    }

    @PutMapping("/pickups/{pickupId}/claim")
    public ResponseEntity<ApiResponse<TaskAssignmentResponse>> claimPickup(
            @PathVariable Long pickupId,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(
                "Pickup claimed successfully",
                volunteerService.claimAwaitingAssignmentPickup(pickupId, user.getUserId())
        ));
    }

    @PutMapping("/tasks/{taskId}/status")
    public ResponseEntity<ApiResponse<TaskAssignmentResponse>> updateTaskStatus(
            @PathVariable Long taskId,
            @RequestParam("status") String status,
            Authentication authentication
    ) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(
                ApiResponse.success("Task status updated", volunteerService.updateTaskStatus(taskId, status, user.getUserId()))
        );
    }

    @PutMapping("/tasks/{taskId}/accept")
    public ResponseEntity<ApiResponse<TaskAssignmentResponse>> acceptTask(@PathVariable Long taskId, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success("Task accepted", volunteerService.acceptTask(taskId, user.getUserId())));
    }

    @PutMapping("/tasks/{taskId}/verify-otp")
    public ResponseEntity<ApiResponse<TaskAssignmentResponse>> verifyPickupOtp(
            @PathVariable Long taskId,
            @Valid @RequestBody PickupOtpVerifyRequest request,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(
                "Pickup OTP verified",
                volunteerService.verifyPickupOtp(taskId, user.getUserId(), request.getOtp())
        ));
    }

    @PutMapping("/tasks/{taskId}/location")
    public ResponseEntity<ApiResponse<TaskAssignmentResponse>> updateTaskLocation(
            @PathVariable Long taskId,
            @Valid @RequestBody VolunteerLocationUpdateRequest request,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(
                "Live location updated",
                volunteerService.updateTaskLiveLocation(taskId, user.getUserId(), request.getLatitude(), request.getLongitude())
        ));
    }

    @PutMapping("/tasks/{taskId}/complete")
    public ResponseEntity<ApiResponse<TaskAssignmentResponse>> completeTask(@PathVariable Long taskId, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success("Task completed", volunteerService.completeTask(taskId, user.getUserId())));
    }

    @GetMapping("/tasks/detailed")
    public ResponseEntity<ApiResponse<List<TaskAssignmentResponse>>> getDetailedTasks(
            Authentication authentication,
            @RequestParam(required = false) String status) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(volunteerService.getDetailedVolunteerTasks(user.getUserId(), status)));
    }

    @GetMapping("/tasks/{taskId}/details")
    public ResponseEntity<ApiResponse<TaskAssignmentResponse>> getTaskDetails(
            @PathVariable Long taskId,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(volunteerService.getTaskDetails(taskId, user.getUserId())));
    }

    @GetMapping("/tasks/status/{status}")
    public ResponseEntity<ApiResponse<List<TaskAssignmentResponse>>> getTasksByStatus(
            @PathVariable String status,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(volunteerService.getDetailedVolunteerTasks(user.getUserId(), status)));
    }
}
