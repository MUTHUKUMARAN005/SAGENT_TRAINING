package com.daansetu.service;

import com.daansetu.dto.response.TaskAssignmentResponse;
import com.daansetu.dto.request.VolunteerRequest;
import com.daansetu.entity.*;
import com.daansetu.enums.PickupStatus;
import com.daansetu.enums.TaskStatus;
import com.daansetu.enums.VolunteerStatus;
import com.daansetu.exception.BadRequestException;
import com.daansetu.exception.ResourceNotFoundException;
import com.daansetu.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VolunteerService {

    private final VolunteerRepository volunteerRepository;
    private final UserRepository userRepository;
    private final NGORepository ngoRepository;
    private final TaskAssignmentRepository taskRepository;
    private final PickupRequestRepository pickupRequestRepository;
    private final EmailService emailService;
    private final WebSocketService webSocketService;
    private final ProofService proofService;
    private final DonationService donationService;

    @Transactional
    public Volunteer registerVolunteer(VolunteerRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));

        volunteerRepository.findByUserUserId(request.getUserId()).ifPresent(v -> {
            throw new BadRequestException("User is already registered as a volunteer");
        });

        NGO ngo = null;
        if (request.getNgoId() != null) {
            ngo = ngoRepository.findById(request.getNgoId())
                    .orElseThrow(() -> new ResourceNotFoundException("NGO", "id", request.getNgoId()));
        }

        Volunteer volunteer = Volunteer.builder()
                .user(user)
                .ngo(ngo)
                .volunteerStatus(VolunteerStatus.ACTIVE)
                .hoursVolunteered(0)
                .tasksCompleted(0)
                .build();

        volunteer = volunteerRepository.save(volunteer);
        log.info("Volunteer registered: {} ({})", user.getName(), volunteer.getVolunteerId());
        return volunteer;
    }

    @Transactional
    public Volunteer registerVolunteerForNgo(Long userId, String ngoEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        NGO ngo = ngoRepository.findByEmailIgnoreCase(ngoEmail)
                .orElseThrow(() -> new ResourceNotFoundException("NGO", "email", ngoEmail));

        volunteerRepository.findByUserUserId(userId).ifPresent(existing -> {
            throw new BadRequestException("User is already registered as a volunteer");
        });

        Volunteer volunteer = Volunteer.builder()
                .user(user)
                .ngo(ngo)
                .volunteerStatus(VolunteerStatus.ACTIVE)
                .hoursVolunteered(0)
                .tasksCompleted(0)
                .build();

        volunteer = volunteerRepository.save(volunteer);
        log.info("Volunteer {} onboarded by NGO {}", volunteer.getVolunteerId(), ngoEmail);
        return volunteer;
    }

    public Map<String, Object> getVolunteerStats(Long userId) {
        Volunteer volunteer = volunteerRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer", "userId", userId));

        List<TaskAssignment> tasks = taskRepository.findByVolunteerVolunteerId(volunteer.getVolunteerId());

        long completedTasks = tasks.stream()
                .filter(t -> t.getTaskStatus() == TaskStatus.COMPLETED)
                .count();

        long pendingTasks = tasks.stream()
                .filter(t -> t.getTaskStatus() == TaskStatus.ASSIGNED || t.getTaskStatus() == TaskStatus.IN_PROGRESS)
                .count();

        return Map.of(
                "volunteerId", volunteer.getVolunteerId(),
                "status", volunteer.getVolunteerStatus(),
                "hoursVolunteered", volunteer.getHoursVolunteered(),
                "totalTasks", tasks.size(),
                "completedTasks", completedTasks,
                "pendingTasks", pendingTasks,
                "joinedDate", volunteer.getJoinedDate()
        );
    }

    @Transactional
    public TaskAssignment assignTask(Long volunteerId, Long pickupId, String description) {
        Volunteer volunteer = volunteerRepository.findById(volunteerId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer", "id", volunteerId));

        PickupRequest pickupRequest = null;
        if (pickupId != null) {
            pickupRequest = pickupRequestRepository.findById(pickupId)
                    .orElseThrow(() -> new ResourceNotFoundException("PickupRequest", "id", pickupId));
            pickupRequest.setPickupStatus(PickupStatus.APPROVED);
        }

        TaskAssignment task = TaskAssignment.builder()
                .volunteer(volunteer)
                .pickupRequest(pickupRequest)
                .description(description)
                .taskStatus(TaskStatus.ASSIGNED)
                .build();

        task = taskRepository.save(task);

        // Send WebSocket notification to volunteer
        webSocketService.notifyVolunteerTask(
                volunteer.getUser().getUserId(),
                Map.of(
                        "taskId", task.getTaskId(),
                        "description", description,
                        "status", "ASSIGNED"
                )
        );

        log.info("Task assigned to volunteer {}: {}", volunteerId, description);
        return task;
    }

    @Transactional
    public TaskAssignmentResponse acceptTask(Long taskId, Long userId) {
        TaskAssignment task = getVolunteerTaskForUser(taskId, userId);
        TaskStatus currentStatus = task.getTaskStatus() != null ? task.getTaskStatus() : TaskStatus.ASSIGNED;

        if (currentStatus != TaskStatus.ASSIGNED) {
            throw new BadRequestException("Only newly assigned tasks can be accepted");
        }

        handleVolunteerAcceptance(task);
        task.setTaskStatus(TaskStatus.ASSIGNED);
        task.setCompletedDate(null);
        task = taskRepository.save(task);

        log.info("Volunteer accepted task: task={} volunteer={}", taskId, task.getVolunteer().getVolunteerId());
        return toTaskAssignmentResponse(task);
    }

    @Transactional
    public TaskAssignmentResponse completeTask(Long taskId, Long userId) {
        return updateTaskStatus(taskId, "COMPLETED", userId);
    }

    @Transactional
    public TaskAssignmentResponse updateTaskStatus(Long taskId, String status, Long userId) {
        TaskAssignment task = getVolunteerTaskForUser(taskId, userId);
        TaskStatus previousStatus = task.getTaskStatus() != null ? task.getTaskStatus() : TaskStatus.ASSIGNED;
        TaskStatus nextStatus = parseTaskStatus(status);

        if (previousStatus == nextStatus) {
            if (nextStatus == TaskStatus.ASSIGNED) {
                handleVolunteerAcceptance(task);
                task = taskRepository.save(task);
            }
            return toTaskAssignmentResponse(task);
        }

        if (!isValidTaskTransition(previousStatus, nextStatus)) {
            throw new BadRequestException("Invalid task transition: " + previousStatus + " -> " + nextStatus);
        }

        if (nextStatus == TaskStatus.IN_PROGRESS) {
            PickupRequest pickup = task.getPickupRequest();
            if (pickup != null && !pickup.isOtpVerified()) {
                throw new BadRequestException("Pickup OTP must be verified before starting pickup");
            }
            handleVolunteerAcceptance(task);
        }

        task.setTaskStatus(nextStatus);
        task.setCompletedDate(nextStatus == TaskStatus.COMPLETED ? LocalDateTime.now() : null);

        if (nextStatus == TaskStatus.COMPLETED && task.getPickupRequest() != null && task.getPickupRequest().getDonation() != null) {
            Long donationId = task.getPickupRequest().getDonation().getDonationId();
            if (!proofService.hasRequiredProofs(donationId)) {
                throw new BadRequestException("Both pickup and delivery proof photos are required before completion");
            }
        }

        if (task.getPickupRequest() != null) {
            task.getPickupRequest().setPickupStatus(toPickupStatus(nextStatus));
        }

        Volunteer volunteer = task.getVolunteer();
        applyVolunteerSummaryDelta(volunteer, previousStatus, nextStatus);
        volunteerRepository.save(volunteer);
        task = taskRepository.save(task);

        if (nextStatus == TaskStatus.IN_PROGRESS && task.getPickupRequest() != null) {
            emailService.sendDonorPickupInProgressEmail(task.getPickupRequest(), volunteer);
        }

        if (nextStatus == TaskStatus.COMPLETED && previousStatus != TaskStatus.COMPLETED) {
            emailService.sendPickupCompletedEmailToStakeholders(task.getPickupRequest(), volunteer);
            if (task.getPickupRequest() != null && task.getPickupRequest().getDonation() != null) {
                donationService.markPhysicalDonationCompleted(task.getPickupRequest().getDonation().getDonationId());
                donationService.generateAndDispatchReceipt(task.getPickupRequest().getDonation().getDonationId(), false);
            }
        }

        log.info("Task status updated: task={} volunteer={} {} -> {}", taskId, volunteer.getVolunteerId(), previousStatus, nextStatus);
        return toTaskAssignmentResponse(task);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getVolunteerTasks(Long userId) {
        Volunteer volunteer = volunteerRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer", "userId", userId));

        return taskRepository.findByVolunteerVolunteerId(volunteer.getVolunteerId())
                .stream()
                .map(t -> {
                    Map<String, Object> payload = new LinkedHashMap<>();
                    PickupRequest pickup = t.getPickupRequest();
                    Donation donation = pickup != null ? pickup.getDonation() : null;
                    User donor = donation != null ? donation.getUser() : null;

                    payload.put("taskId", t.getTaskId());
                    payload.put("pickupId", pickup != null ? pickup.getPickupId() : null);
                    payload.put("description", t.getDescription() != null ? t.getDescription() : "");
                    payload.put("status", toVolunteerStatus(t.getTaskStatus(), pickup));
                    payload.put("otpVerified", pickup != null && pickup.isOtpVerified());
                    payload.put("otpVerifiedAt", pickup != null && pickup.getOtpVerifiedAt() != null ? pickup.getOtpVerifiedAt().toString() : null);
                    payload.put("assignedDate", t.getAssignedDate() != null ? t.getAssignedDate().toString() : null);
                    payload.put("completedDate", t.getCompletedDate() != null ? t.getCompletedDate().toString() : null);
                    payload.put("donorName", donor != null ? donor.getName() : "Donor");
                    payload.put("address", pickup != null && pickup.getDonorAddress() != null ? pickup.getDonorAddress() : "Address unavailable");
                    payload.put("itemType", donation != null && donation.getDonationType() != null ? donation.getDonationType().name() : "OTHER");
                    payload.put("pickupDate", pickup != null && pickup.getPickupDate() != null ? pickup.getPickupDate().toString() : null);
                    payload.put("timeSlot", pickup != null ? pickup.getTimeSlot() : null);
                    payload.put("contactPhone", pickup != null ? pickup.getContactPhone() : null);
                        payload.put("volunteerLatitude", pickup != null ? pickup.getVolunteerLatitude() : null);
                        payload.put("volunteerLongitude", pickup != null ? pickup.getVolunteerLongitude() : null);
                        payload.put("volunteerLocationUpdatedAt", pickup != null && pickup.getVolunteerLocationUpdatedAt() != null
                            ? pickup.getVolunteerLocationUpdatedAt().toString()
                            : null);
                    return payload;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskAssignmentResponse> getDetailedVolunteerTasks(Long userId, String status) {
        Volunteer volunteer = volunteerRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer", "userId", userId));

        TaskStatus filterStatus = null;
        if (status != null && !status.isBlank()) {
            filterStatus = parseTaskStatus(status);
        }

        TaskStatus finalFilterStatus = filterStatus;
        return taskRepository.findByVolunteerVolunteerId(volunteer.getVolunteerId())
                .stream()
                .filter(task -> {
                    if (finalFilterStatus == null) return true;
                    TaskStatus current = task.getTaskStatus() != null ? task.getTaskStatus() : TaskStatus.ASSIGNED;
                    return current == finalFilterStatus;
                })
                .map(this::toTaskAssignmentResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAwaitingAssignmentPickups(Long userId) {
        Volunteer volunteer = volunteerRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer", "userId", userId));

        String ngoEmail = volunteer.getNgo() != null ? volunteer.getNgo().getEmail() : null;
        if (ngoEmail == null || ngoEmail.isBlank()) {
            return List.of();
        }

        return pickupRequestRepository.findAwaitingAssignmentByNgoEmail(
                        ngoEmail,
                        EnumSet.of(PickupStatus.APPROVED, PickupStatus.SCHEDULED),
                        LocalDate.now())
                .stream()
                .map(pickup -> {
                    Donation donation = pickup.getDonation();
                    User donor = donation != null ? donation.getUser() : null;
                    Map<String, Object> payload = new LinkedHashMap<>();
                    payload.put("pickupId", pickup.getPickupId());
                    payload.put("donorName", donor != null ? donor.getName() : "Donor");
                    payload.put("donorPhone", donor != null ? donor.getPhone() : null);
                    payload.put("donorEmail", donor != null ? donor.getEmail() : null);
                    payload.put("address", pickup.getDonorAddress());
                    payload.put("itemType", donation != null && donation.getDonationType() != null ? donation.getDonationType().name() : "OTHER");
                    payload.put("pickupDate", pickup.getPickupDate());
                    payload.put("timeSlot", pickup.getTimeSlot());
                    payload.put("contactPhone", pickup.getContactPhone());
                    payload.put("status", pickup.getPickupStatus() != null ? pickup.getPickupStatus().name() : "APPROVED");
                    payload.put("notes", pickup.getNotes());
                    return payload;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskAssignmentResponse claimAwaitingAssignmentPickup(Long pickupId, Long userId) {
        Volunteer volunteer = volunteerRepository.findByUserUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer", "userId", userId));

        String volunteerNgoEmail = volunteer.getNgo() != null ? volunteer.getNgo().getEmail() : null;
        if (volunteerNgoEmail == null || volunteerNgoEmail.isBlank()) {
            throw new BadRequestException("You are not linked to an NGO");
        }

        PickupRequest pickup = pickupRequestRepository.findById(pickupId)
                .orElseThrow(() -> new ResourceNotFoundException("PickupRequest", "id", pickupId));

        String pickupNgoEmail = pickup.getDonation() != null
                && pickup.getDonation().getCampaign() != null
                && pickup.getDonation().getCampaign().getNgo() != null
                ? pickup.getDonation().getCampaign().getNgo().getEmail()
                : null;

        if (pickupNgoEmail == null || !volunteerNgoEmail.equalsIgnoreCase(pickupNgoEmail)) {
            throw new BadRequestException("You can only claim pickups from your NGO");
        }

        PickupStatus pickupStatus = pickup.getPickupStatus();
        if (pickupStatus != PickupStatus.APPROVED && pickupStatus != PickupStatus.SCHEDULED) {
            throw new BadRequestException("Pickup is not available for claim");
        }

        if (!taskRepository.findByPickupRequestPickupId(pickupId).isEmpty()) {
            throw new BadRequestException("Pickup is already assigned");
        }

        TaskAssignment task = TaskAssignment.builder()
                .volunteer(volunteer)
                .pickupRequest(pickup)
                .description("Claimed pickup task for request #" + pickupId)
                .taskStatus(TaskStatus.ASSIGNED)
                .build();
        task = taskRepository.save(task);

        emailService.sendVolunteerAppliedEmailToApprovers(pickup, volunteer);
        pickup.setPickupStatus(PickupStatus.ASSIGNED);
        pickup.setOtpVerified(false);
        pickup.setOtpVerifiedAt(null);
        pickupRequestRepository.save(pickup);

        emailService.sendDonorPickupAssignedEmail(pickup, volunteer);
        emailService.sendVolunteerPickupAssignedEmail(pickup, volunteer);
        emailService.sendPickupVerificationOtpEmail(pickup, volunteer);
        emailService.sendPickupAssignmentConfirmationToAdmins(pickup, volunteer);

        webSocketService.notifyVolunteerTask(
                volunteer.getUser().getUserId(),
                Map.of(
                        "pickupId", pickupId,
                        "taskId", task.getTaskId(),
                        "description", task.getDescription(),
                        "status", "ASSIGNED"
                )
        );

        return toTaskAssignmentResponse(task);
    }

    @Transactional(readOnly = true)
    public TaskAssignmentResponse getTaskDetails(Long taskId, Long userId) {
        TaskAssignment task = getVolunteerTaskForUser(taskId, userId);
        return toTaskAssignmentResponse(task);
    }

    @Transactional
    public TaskAssignmentResponse verifyPickupOtp(Long taskId, Long userId, String otp) {
        TaskAssignment task = getVolunteerTaskForUser(taskId, userId);
        PickupRequest pickup = task.getPickupRequest();

        if (pickup == null) {
            throw new BadRequestException("No pickup found for this task");
        }

        if (task.getTaskStatus() != TaskStatus.ASSIGNED) {
            throw new BadRequestException("OTP can be verified only while task is assigned");
        }

        emailService.verifyPickupOtp(pickup, otp);
        pickup.setOtpVerified(true);
        pickup.setOtpVerifiedAt(LocalDateTime.now());
        pickupRequestRepository.save(pickup);

        return toTaskAssignmentResponse(task);
    }

    @Transactional
    public TaskAssignmentResponse updateTaskLiveLocation(Long taskId, Long userId, Double latitude, Double longitude) {
        TaskAssignment task = getVolunteerTaskForUser(taskId, userId);
        PickupRequest pickup = task.getPickupRequest();

        if (pickup == null) {
            throw new BadRequestException("No pickup found for this task");
        }

        TaskStatus status = task.getTaskStatus() != null ? task.getTaskStatus() : TaskStatus.ASSIGNED;
        if (status != TaskStatus.ASSIGNED && status != TaskStatus.IN_PROGRESS) {
            throw new BadRequestException("Live tracking is allowed only for active pickup tasks");
        }

        if (!pickup.isOtpVerified()) {
            throw new BadRequestException("Pickup OTP must be verified before sharing live location");
        }

        pickup.setVolunteerLatitude(latitude);
        pickup.setVolunteerLongitude(longitude);
        pickup.setVolunteerLocationUpdatedAt(LocalDateTime.now());
        pickupRequestRepository.save(pickup);

        webSocketService.broadcastPickupLiveLocation(pickup, task.getVolunteer());

        return toTaskAssignmentResponse(task);
    }

    private TaskAssignment getVolunteerTaskForUser(Long taskId, Long userId) {
        TaskAssignment task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

        Long ownerUserId = task.getVolunteer() != null && task.getVolunteer().getUser() != null
                ? task.getVolunteer().getUser().getUserId()
                : null;

        if (userId != null && ownerUserId != null && !userId.equals(ownerUserId)) {
            throw new BadRequestException("You can only update your assigned tasks");
        }

        return task;
    }

    private TaskStatus parseTaskStatus(String status) {
        String normalized = String.valueOf(status).trim().toUpperCase(Locale.ROOT);

        if (normalized.isBlank()) {
            throw new BadRequestException("Task status is required");
        }

        if ("PENDING".equals(normalized)) {
            return TaskStatus.ASSIGNED;
        }
        if ("ACCEPTED".equals(normalized)) {
            return TaskStatus.ASSIGNED;
        }

        try {
            return TaskStatus.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unsupported task status: " + status);
        }
    }

    private boolean isValidTaskTransition(TaskStatus from, TaskStatus to) {
        if (from == null || to == null || from == to) {
            return false;
        }

        return switch (from) {
            case ASSIGNED -> to == TaskStatus.IN_PROGRESS || to == TaskStatus.CANCELLED;
            case IN_PROGRESS -> to == TaskStatus.COMPLETED || to == TaskStatus.CANCELLED;
            default -> false;
        };
    }

    private String toVolunteerStatus(TaskStatus taskStatus) {
        return toVolunteerStatus(taskStatus, null);
    }

    private String toVolunteerStatus(TaskStatus taskStatus, PickupRequest pickup) {
        if (taskStatus == null) {
            return "ASSIGNED";
        }

        if (taskStatus == TaskStatus.ASSIGNED && pickup != null && pickup.isOtpVerified()) {
            return "OTP_VERIFIED";
        }

        return taskStatus.name();
    }

    private PickupStatus toPickupStatus(TaskStatus taskStatus) {
        if (taskStatus == TaskStatus.COMPLETED) {
            return PickupStatus.COMPLETED;
        }
        if (taskStatus == TaskStatus.IN_PROGRESS) {
            // Keep pickup lifecycle DB-compatible in deployments that still use legacy enums.
            return PickupStatus.SCHEDULED;
        }
        if (taskStatus == TaskStatus.CANCELLED) {
            return PickupStatus.CANCELLED;
        }
        return PickupStatus.ASSIGNED;
    }

    private TaskAssignmentResponse toTaskAssignmentResponse(TaskAssignment task) {
        PickupRequest pickup = task.getPickupRequest();
        Donation donation = pickup != null ? pickup.getDonation() : null;
        User donor = donation != null ? donation.getUser() : null;

        return TaskAssignmentResponse.builder()
                .taskId(task.getTaskId())
                .pickupId(pickup != null ? pickup.getPickupId() : null)
            .donationId(donation != null ? donation.getDonationId() : null)
                .description(task.getDescription())
                .status(toVolunteerStatus(task.getTaskStatus(), pickup))
                .assignedDate(task.getAssignedDate())
                .completedDate(task.getCompletedDate())
                .donorId(donor != null ? donor.getUserId() : null)
                .donorName(donor != null ? donor.getName() : "Donor")
                .donorPhone(donor != null ? donor.getPhone() : null)
                .donorEmail(donor != null ? donor.getEmail() : null)
                .address(pickup != null ? pickup.getDonorAddress() : "Address unavailable")
                .itemType(donation != null && donation.getDonationType() != null ? donation.getDonationType().name() : "OTHER")
                .pickupDate(pickup != null ? pickup.getPickupDate() : null)
                .timeSlot(pickup != null ? pickup.getTimeSlot() : null)
                .contactPhone(pickup != null ? pickup.getContactPhone() : null)
                .notes(pickup != null ? pickup.getNotes() : null)
                .latitude(pickup != null ? pickup.getLatitude() : null)
                .longitude(pickup != null ? pickup.getLongitude() : null)
                .volunteerLatitude(pickup != null ? pickup.getVolunteerLatitude() : null)
                .volunteerLongitude(pickup != null ? pickup.getVolunteerLongitude() : null)
                .volunteerLocationUpdatedAt(pickup != null ? pickup.getVolunteerLocationUpdatedAt() : null)
                .pickupStatus(pickup != null && pickup.getPickupStatus() != null ? pickup.getPickupStatus().name() : null)
                .otpVerified(pickup != null && pickup.isOtpVerified())
                .otpVerifiedAt(pickup != null ? pickup.getOtpVerifiedAt() : null)
                .build();
    }

    private void applyVolunteerSummaryDelta(Volunteer volunteer, TaskStatus previousStatus, TaskStatus nextStatus) {
        if (previousStatus != TaskStatus.COMPLETED && nextStatus == TaskStatus.COMPLETED) {
            volunteer.setTasksCompleted(Math.max(0, volunteer.getTasksCompleted() + 1));
            volunteer.setHoursVolunteered(Math.max(0, volunteer.getHoursVolunteered() + 2));
            return;
        }

        if (previousStatus == TaskStatus.COMPLETED && nextStatus != TaskStatus.COMPLETED) {
            volunteer.setTasksCompleted(Math.max(0, volunteer.getTasksCompleted() - 1));
            volunteer.setHoursVolunteered(Math.max(0, volunteer.getHoursVolunteered() - 2));
        }
    }

    private void handleVolunteerAcceptance(TaskAssignment task) {
        PickupRequest pickup = task.getPickupRequest();
        if (pickup == null) {
            return;
        }

        PickupStatus currentStatus = pickup.getPickupStatus();
        if (currentStatus == PickupStatus.ASSIGNED
                || currentStatus == PickupStatus.IN_PROGRESS
                || currentStatus == PickupStatus.COMPLETED) {
            return;
        }

        pickup.setPickupStatus(PickupStatus.ASSIGNED);
        pickupRequestRepository.save(pickup);

        Volunteer volunteer = task.getVolunteer();
        emailService.sendDonorPickupAssignedEmail(pickup, volunteer);
        emailService.sendVolunteerPickupAssignedEmail(pickup, volunteer);
    }
}
