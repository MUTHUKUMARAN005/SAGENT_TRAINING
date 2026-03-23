package com.daansetu.service;

import com.daansetu.dto.request.PickupRequestDTO;
import com.daansetu.dto.response.PickupResponse;
import com.daansetu.entity.*;
import com.daansetu.enums.DonationType;
import com.daansetu.enums.PickupStatus;
import com.daansetu.enums.TaskStatus;
import com.daansetu.enums.UserRole;
import com.daansetu.enums.VolunteerStatus;
import com.daansetu.exception.BadRequestException;
import com.daansetu.exception.ResourceNotFoundException;
import com.daansetu.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PickupService {

    private final PickupRequestRepository pickupRepository;
    private final DonationRepository donationRepository;
    private final DonationItemRepository donationItemRepository;
    private final NotificationRepository notificationRepository;
    private final VolunteerRepository volunteerRepository;
    private final UserRepository userRepository;
    private final NGORepository ngoRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final SmsService smsService;
    private final EmailService emailService;
    private final WebSocketService webSocketService;
    private final ProofService proofService;
    private final DonationService donationService;

    @Transactional
    public PickupResponse createPickupRequest(PickupRequestDTO request, Long requesterUserId) {
        Donation donation = donationRepository.findById(request.getDonationId())
                .orElseThrow(() -> new ResourceNotFoundException("Donation", "id", request.getDonationId()));

        Long donorUserId = donation.getUser() != null ? donation.getUser().getUserId() : null;
        if (requesterUserId == null || donorUserId == null || !requesterUserId.equals(donorUserId)) {
            throw new AccessDeniedException("You can schedule pickup only for your own donation");
        }

        if (donation.getDonationType() == DonationType.MONEY) {
            throw new BadRequestException("Pickup requests are supported only for physical donations");
        }

        PickupRequest pickup = PickupRequest.builder()
                .donation(donation)
                .donorAddress(request.getAddress())
                .pickupDate(request.getPickupDate())
                .timeSlot(request.getTimeSlot())
                .contactPhone(request.getContactPhone())
                .notes(request.getNotes())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .pickupStatus(PickupStatus.PENDING)
                .reminderSent(false)
                .build();

        pickup = pickupRepository.save(pickup);

        // Create notification
        Notification notification = Notification.builder()
                .user(donation.getUser())
                .title("Pickup Request Submitted")
                .message("Your pickup request is pending NGO approval for " + request.getPickupDate() +
                        " at " + request.getTimeSlot())
                .type(Notification.NotificationType.PICKUP)
                .referenceId(pickup.getPickupId())
                .referenceType("PICKUP")
                .build();
        notificationRepository.save(notification);

        // Send SMS confirmation
        if (request.getContactPhone() != null) {
            smsService.sendPickupReminder(
                    request.getContactPhone(),
                    donation.getUser().getName(),
                    request.getPickupDate().toString(),
                    request.getTimeSlot(),
                    request.getAddress()
            );
        }

        // WebSocket notification
        webSocketService.sendNotification(
                donation.getUser().getUserId(),
                "Pickup Request Submitted",
                "Your pickup request is pending approval",
                "PICKUP",
                pickup.getPickupId()
        );

        emailService.sendPickupApprovalRequestEmail(pickup);
        emailService.sendPickupRequestCreatedEmailToStakeholders(pickup);

        log.info("Pickup request created: {} for donation {}", pickup.getPickupId(), request.getDonationId());
        return mapToResponse(pickup);
    }

    @Transactional(readOnly = true)
    public List<PickupResponse> getPickupsByUser(Long userId) {
        return pickupRepository.findByDonationUserUserId(userId).stream()
                .sorted(Comparator
                        .comparing(PickupRequest::getPickupDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(PickupRequest::getPickupId, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PickupResponse> getPickupsByStatus(PickupStatus status) {
        return pickupRepository.findByPickupStatus(status).stream()
                .sorted(Comparator
                        .comparing(PickupRequest::getPickupDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(PickupRequest::getPickupId, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PickupResponse> getPickupsByNgoAccess(Long ngoUserId, String ngoEmail, PickupStatus status) {
        List<PickupRequest> pickups = status == null
                ? pickupRepository.findByNgoAccessContext(ngoUserId, ngoEmail)
                : pickupRepository.findByNgoAccessContextAndPickupStatus(ngoUserId, ngoEmail, status);

        return pickups.stream()
                .sorted(Comparator
                        .comparing(PickupRequest::getPickupDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(PickupRequest::getPickupId, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getNgoVolunteers(String ngoEmail) {
        return volunteerRepository.findByNgoEmail(ngoEmail).stream()
                .filter(volunteer -> volunteer.getVolunteerStatus() == VolunteerStatus.ACTIVE)
                .map(volunteer -> {
                    Map<String, Object> payload = new LinkedHashMap<>();
                    payload.put("volunteerId", volunteer.getVolunteerId());
                    payload.put("userId", volunteer.getUser() != null ? volunteer.getUser().getUserId() : null);
                    payload.put("name", volunteer.getUser() != null ? volunteer.getUser().getName() : "Volunteer");
                    payload.put("email", volunteer.getUser() != null ? volunteer.getUser().getEmail() : null);
                    payload.put("status", volunteer.getVolunteerStatus() != null ? volunteer.getVolunteerStatus().name() : "ACTIVE");
                    payload.put("tasksCompleted", volunteer.getTasksCompleted());
                    payload.put("hoursVolunteered", volunteer.getHoursVolunteered());
                    return payload;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public PickupResponse decidePickupForNgo(Long pickupId, Long ngoUserId, String ngoEmail, String decision) {
        PickupRequest pickup = getNgoPickupOrThrow(pickupId, ngoUserId, ngoEmail);
        String normalized = String.valueOf(decision).trim().toLowerCase();

        if (pickup.getPickupStatus() != PickupStatus.PENDING && pickup.getPickupStatus() != PickupStatus.SCHEDULED) {
            throw new BadRequestException("Pickup decision can be applied only to pending requests");
        }

        if ("accept".equals(normalized) || "approve".equals(normalized) || "approved".equals(normalized)) {
            pickup.setPickupStatus(PickupStatus.APPROVED);
            emailService.sendDonorPickupApprovedEmail(pickup);
        } else if ("reject".equals(normalized) || "rejected".equals(normalized)) {
            pickup.setPickupStatus(PickupStatus.REJECTED);
        } else {
            throw new BadRequestException("decision must be either 'approve' or 'reject'");
        }

        pickup = pickupRepository.save(pickup);

        if (pickup.getDonation() != null && pickup.getDonation().getUser() != null) {
            String donorMessage = pickup.getPickupStatus() == PickupStatus.APPROVED
                    ? "Your pickup request was approved and is awaiting volunteer acceptance."
                    : "Your pickup request was rejected by the NGO.";

            notificationRepository.save(Notification.builder()
                    .user(pickup.getDonation().getUser())
                    .title("Pickup Request Update")
                    .message(donorMessage)
                    .type(Notification.NotificationType.PICKUP)
                    .referenceId(pickup.getPickupId())
                    .referenceType("PICKUP")
                    .build());

            webSocketService.sendNotification(
                    pickup.getDonation().getUser().getUserId(),
                    "Pickup Request Update",
                    donorMessage,
                    "PICKUP",
                    pickup.getPickupId()
            );
        }

        log.info("NGO pickup decision applied: pickup={} decision={}", pickupId, normalized);
        return mapToResponse(pickup);
    }

    @Transactional
    public PickupResponse assignVolunteerForNgo(Long pickupId, Long ngoUserId, String ngoEmail, Long volunteerId, String description) {
        PickupRequest pickup = getNgoPickupOrThrow(pickupId, ngoUserId, ngoEmail);
        Volunteer volunteer = volunteerRepository.findById(volunteerId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer", "id", volunteerId));

        if (pickup.getPickupStatus() != PickupStatus.APPROVED && pickup.getPickupStatus() != PickupStatus.SCHEDULED) {
            throw new BadRequestException("Pickup must be approved before volunteer assignment");
        }

        String volunteerNgoEmail = volunteer.getNgo() != null ? volunteer.getNgo().getEmail() : null;
        if (volunteerNgoEmail == null || !volunteerNgoEmail.equalsIgnoreCase(ngoEmail)) {
            throw new AccessDeniedException("You can assign only volunteers from your NGO");
        }

        TaskAssignment assignment = taskAssignmentRepository
                .findByPickupRequestPickupIdAndVolunteerVolunteerId(pickupId, volunteerId)
                .orElseGet(() -> TaskAssignment.builder()
                        .pickupRequest(pickup)
                        .volunteer(volunteer)
                        .description(
                                description != null && !description.isBlank()
                                        ? description.trim()
                                        : "Pickup assignment for request #" + pickupId
                        )
                        .taskStatus(TaskStatus.ASSIGNED)
                        .build()
                );

        assignment.setTaskStatus(TaskStatus.ASSIGNED);
        taskAssignmentRepository.save(assignment);

        // Keep pickup lifecycle in SCHEDULED for compatibility with older DB enums.
        pickup.setPickupStatus(PickupStatus.SCHEDULED);
        pickup.setOtpVerified(false);
        pickup.setOtpVerifiedAt(null);
        pickupRepository.save(pickup);

        emailService.sendDonorPickupAssignedEmail(pickup, volunteer);
        emailService.sendVolunteerPickupAssignedEmail(pickup, volunteer);
        emailService.sendPickupVerificationOtpEmail(pickup, volunteer);
        emailService.sendPickupAssignmentConfirmationToAdmins(pickup, volunteer);

        if (volunteer.getUser() != null) {
            String safeDescription = assignment.getDescription() != null
                    ? assignment.getDescription()
                    : "Pickup assignment for request #" + pickupId;
            webSocketService.notifyVolunteerTask(
                    volunteer.getUser().getUserId(),
                    Map.of(
                            "pickupId", pickupId,
                            "taskId", assignment.getTaskId(),
                            "description", safeDescription,
                            "status", "ASSIGNED"
                    )
            );
        }

        log.info("Volunteer {} assigned to pickup {} by NGO {}", volunteerId, pickupId, ngoEmail);
        return mapToResponse(pickup);
    }

    @Transactional
    public PickupResponse assignVolunteerAsAdmin(Long pickupId, Long volunteerId, String description) {
        PickupRequest pickup = pickupRepository.findById(pickupId)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup", "id", pickupId));

        if (pickup.getPickupStatus() == PickupStatus.PENDING) {
            // Use SCHEDULED here to stay compatible with databases that don't include APPROVED in enum.
            pickup.setPickupStatus(PickupStatus.SCHEDULED);
            pickupRepository.save(pickup);
        }

        String ngoEmail = pickup.getDonation() != null
                && pickup.getDonation().getCampaign() != null
                && pickup.getDonation().getCampaign().getNgo() != null
                ? pickup.getDonation().getCampaign().getNgo().getEmail()
                : null;

        if (ngoEmail == null || ngoEmail.isBlank()) {
            throw new BadRequestException("Pickup is not linked to a valid NGO");
        }

        Volunteer resolvedVolunteer = resolveOrCreateVolunteerForAdmin(volunteerId, ngoEmail);

        return assignVolunteerForNgo(pickupId, null, ngoEmail, resolvedVolunteer.getVolunteerId(), description);
    }

    private Volunteer resolveOrCreateVolunteerForAdmin(Long volunteerIdOrUserId, String ngoEmail) {
        return volunteerRepository.findById(volunteerIdOrUserId)
                .or(() -> volunteerRepository.findByUserUserId(volunteerIdOrUserId))
                .orElseGet(() -> {
                    User user = userRepository.findById(volunteerIdOrUserId)
                            .orElseThrow(() -> new ResourceNotFoundException("Volunteer", "id", volunteerIdOrUserId));

                    if (user.getRole() != UserRole.VOLUNTEER) {
                        throw new BadRequestException("Selected user is not a volunteer");
                    }

                        NGO ngo = ngoRepository.findByEmailIgnoreCase(ngoEmail)
                            .orElseThrow(() -> new BadRequestException("Pickup is not linked to a valid NGO"));

                    Volunteer volunteer = Volunteer.builder()
                            .user(user)
                            .ngo(ngo)
                            .volunteerStatus(VolunteerStatus.ACTIVE)
                            .hoursVolunteered(0)
                            .tasksCompleted(0)
                            .build();

                    return volunteerRepository.save(volunteer);
                });
    }

    @Transactional
    public PickupResponse updatePickupStatusForNgo(Long pickupId, Long ngoUserId, String ngoEmail, PickupStatus newStatus) {
        PickupRequest pickup = getNgoPickupOrThrow(pickupId, ngoUserId, ngoEmail);
        PickupStatus currentStatus = pickup.getPickupStatus();

        if (newStatus != PickupStatus.APPROVED
                && newStatus != PickupStatus.ASSIGNED
                && newStatus != PickupStatus.IN_PROGRESS
                && newStatus != PickupStatus.COMPLETED
                && newStatus != PickupStatus.CANCELLED) {
            throw new BadRequestException("NGO can update status only to APPROVED, ASSIGNED, IN_PROGRESS, COMPLETED, or CANCELLED");
        }

        if (currentStatus != newStatus && !isValidWorkflowTransition(currentStatus, newStatus)) {
            throw new BadRequestException("Invalid pickup transition: " + currentStatus + " -> " + newStatus);
        }

        if (newStatus == PickupStatus.IN_PROGRESS && !pickup.isOtpVerified()) {
            throw new BadRequestException("Pickup OTP must be verified before starting pickup");
        }

        var latestTask = taskAssignmentRepository.findTopByPickupRequestPickupIdOrderByAssignedDateDesc(pickupId);
        if ((newStatus == PickupStatus.SCHEDULED || newStatus == PickupStatus.ASSIGNED)
                && latestTask.isPresent()
                && latestTask.get().getVolunteer() != null) {
            emailService.sendDonorPickupAssignedEmail(pickup, latestTask.get().getVolunteer());
        }

        if (newStatus == PickupStatus.COMPLETED && pickup.getDonation() != null) {
            Long donationId = pickup.getDonation().getDonationId();
            if (!proofService.hasRequiredProofs(donationId)) {
                throw new BadRequestException("Both pickup and delivery proof photos are required before completion");
            }
        }

        pickup.setPickupStatus(newStatus);
        pickup = pickupRepository.save(pickup);

        if (newStatus == PickupStatus.COMPLETED) {
            final PickupRequest savedPickup = pickup;
            latestTask.ifPresent(task -> {
                        task.setTaskStatus(TaskStatus.COMPLETED);
                        task.setCompletedDate(LocalDateTime.now());
                        taskAssignmentRepository.save(task);
                    });
            emailService.sendPickupCompletedEmailToStakeholders(savedPickup, latestTask.map(TaskAssignment::getVolunteer).orElse(null));
            if (savedPickup.getDonation() != null) {
                donationService.markPhysicalDonationCompleted(savedPickup.getDonation().getDonationId());
                donationService.generateAndDispatchReceipt(savedPickup.getDonation().getDonationId(), false);
            }
        }

        log.info("NGO pickup status updated: pickup={} status={}", pickupId, newStatus);
        return mapToResponse(pickup);
    }

    @Transactional
    public PickupResponse updatePickupStatus(Long pickupId, PickupStatus newStatus) {
        PickupRequest pickup = pickupRepository.findById(pickupId)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup", "id", pickupId));

        PickupStatus currentStatus = pickup.getPickupStatus();
        if (currentStatus != newStatus && !isValidWorkflowTransition(currentStatus, newStatus)) {
            throw new BadRequestException("Invalid pickup transition: " + currentStatus + " -> " + newStatus);
        }

        if (newStatus == PickupStatus.IN_PROGRESS && !pickup.isOtpVerified()) {
            throw new BadRequestException("Pickup OTP must be verified before starting pickup");
        }

        var latestTask = taskAssignmentRepository.findTopByPickupRequestPickupIdOrderByAssignedDateDesc(pickupId);
        if ((newStatus == PickupStatus.SCHEDULED || newStatus == PickupStatus.ASSIGNED)
                && latestTask.isPresent()
                && latestTask.get().getVolunteer() != null) {
            emailService.sendDonorPickupAssignedEmail(pickup, latestTask.get().getVolunteer());
        }

        if (newStatus == PickupStatus.COMPLETED && pickup.getDonation() != null) {
            Long donationId = pickup.getDonation().getDonationId();
            if (!proofService.hasRequiredProofs(donationId)) {
                throw new BadRequestException("Both pickup and delivery proof photos are required before completion");
            }
        }

        pickup.setPickupStatus(newStatus);
        pickup = pickupRepository.save(pickup);

        // Keep volunteer task timeline aligned when pickup status is changed from admin/global endpoints.
        if (newStatus == PickupStatus.IN_PROGRESS) {
            latestTask.ifPresent(task -> {
                if (task.getTaskStatus() != TaskStatus.IN_PROGRESS) {
                    task.setTaskStatus(TaskStatus.IN_PROGRESS);
                    task.setCompletedDate(null);
                    taskAssignmentRepository.save(task);
                }
            });
        }

        if (newStatus == PickupStatus.COMPLETED) {
            latestTask.ifPresent(task -> {
                if (task.getTaskStatus() != TaskStatus.COMPLETED) {
                    task.setTaskStatus(TaskStatus.COMPLETED);
                    task.setCompletedDate(LocalDateTime.now());
                    taskAssignmentRepository.save(task);
                }
            });
            emailService.sendPickupCompletedEmailToStakeholders(pickup, latestTask.map(TaskAssignment::getVolunteer).orElse(null));
            if (pickup.getDonation() != null) {
                donationService.markPhysicalDonationCompleted(pickup.getDonation().getDonationId());
                donationService.generateAndDispatchReceipt(pickup.getDonation().getDonationId(), false);
            }
        }

        log.info("Pickup {} status updated to {}", pickupId, newStatus);
        return mapToResponse(pickup);
    }

    private PickupRequest getNgoPickupOrThrow(Long pickupId, Long ngoUserId, String ngoEmail) {
        if (ngoUserId != null) {
            return pickupRepository.findByPickupIdAndNgoAccessContext(pickupId, ngoUserId, ngoEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("Pickup", "id", pickupId));
        }

        return pickupRepository.findByPickupIdAndDonationCampaignNgoEmail(pickupId, ngoEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup", "id", pickupId));
    }

    private boolean isValidWorkflowTransition(PickupStatus from, PickupStatus to) {
        if (from == null || to == null) {
            return false;
        }

        return switch (from) {
            case PENDING -> to == PickupStatus.APPROVED
                    || to == PickupStatus.SCHEDULED
                    || to == PickupStatus.REJECTED
                    || to == PickupStatus.CANCELLED;
            case APPROVED -> to == PickupStatus.SCHEDULED
                    || to == PickupStatus.ASSIGNED
                    || to == PickupStatus.IN_PROGRESS
                    || to == PickupStatus.COMPLETED
                    || to == PickupStatus.CANCELLED;
            case SCHEDULED -> to == PickupStatus.ASSIGNED
                    || to == PickupStatus.IN_PROGRESS
                    || to == PickupStatus.COMPLETED
                    || to == PickupStatus.CANCELLED;
            case ASSIGNED -> to == PickupStatus.IN_PROGRESS
                    || to == PickupStatus.COMPLETED
                    || to == PickupStatus.CANCELLED;
            case IN_PROGRESS -> to == PickupStatus.COMPLETED || to == PickupStatus.CANCELLED;
            default -> false;
        };
    }

    private PickupResponse mapToResponse(PickupRequest pickup) {
        var latestTask = taskAssignmentRepository.findTopByPickupRequestPickupIdOrderByAssignedDateDesc(pickup.getPickupId());
        String volunteerName = latestTask
                .map(TaskAssignment::getVolunteer)
                .map(Volunteer::getUser)
                .map(User::getName)
                .orElse(null);
        String volunteerPhone = latestTask
                .map(TaskAssignment::getVolunteer)
                .map(Volunteer::getUser)
                .map(User::getPhone)
                .orElse(null);

        return PickupResponse.builder()
                .pickupId(pickup.getPickupId())
                .donationId(pickup.getDonation().getDonationId())
                .donorId(pickup.getDonation().getUser() != null ? pickup.getDonation().getUser().getUserId() : null)
                .donorName(pickup.getDonation().getUser().getName())
                .donorAddress(pickup.getDonorAddress())
                .pickupDate(pickup.getPickupDate())
                .timeSlot(pickup.getTimeSlot())
                .pickupStatus(pickup.getPickupStatus())
                .contactPhone(pickup.getContactPhone())
                .notes(pickup.getNotes())
                .latitude(pickup.getLatitude())
                .longitude(pickup.getLongitude())
                .volunteerLatitude(pickup.getVolunteerLatitude())
                .volunteerLongitude(pickup.getVolunteerLongitude())
                .volunteerLocationUpdatedAt(pickup.getVolunteerLocationUpdatedAt())
                .volunteerName(volunteerName)
                .volunteerPhone(volunteerPhone)
                .otpVerified(pickup.isOtpVerified())
                .otpVerifiedAt(pickup.getOtpVerifiedAt())
                .reminderSent(pickup.isReminderSent())
                .items(donationItemRepository.findByDonationDonationId(pickup.getDonation().getDonationId())
                        .stream()
                        .map(item -> item.getCategory() != null && !item.getCategory().isBlank()
                                ? item.getCategory()
                                : item.getItemName())
                        .filter(item -> item != null && !item.isBlank())
                        .distinct()
                        .collect(Collectors.toList()))
                .build();
    }
}
