package com.daansetu.service;

import com.daansetu.dto.request.NGORequest;
import com.daansetu.dto.response.NGOResponse;
import com.daansetu.dto.response.PageResponse;
import com.daansetu.entity.NGO;
import com.daansetu.entity.Volunteer;
import com.daansetu.entity.TaskAssignment;
import com.daansetu.enums.VolunteerStatus;
import com.daansetu.enums.TaskStatus;
import com.daansetu.exception.DuplicateResourceException;
import com.daansetu.exception.ResourceNotFoundException;
import com.daansetu.repository.NGORepository;
import com.daansetu.repository.VolunteerRepository;
import com.daansetu.repository.TaskAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NGOService {

    private final NGORepository ngoRepository;
    private final VolunteerRepository volunteerRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;

    public List<NGOResponse> getAllVerifiedNGOs() {
        return ngoRepository.findByVerifiedTrue().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public PageResponse<NGOResponse> getAllNGOs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<NGO> ngos = ngoRepository.findAll(pageable);

        List<NGOResponse> content = ngos.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.<NGOResponse>builder()
                .content(content)
                .page(ngos.getNumber())
                .size(ngos.getSize())
                .totalElements(ngos.getTotalElements())
                .totalPages(ngos.getTotalPages())
                .last(ngos.isLast())
                .build();
    }

    public NGOResponse getNGOById(Long ngoId) {
        NGO ngo = ngoRepository.findById(ngoId)
                .orElseThrow(() -> new ResourceNotFoundException("NGO", "id", ngoId));
        return mapToResponse(ngo);
    }

    public List<NGOResponse> getNGOsByCity(String city) {
        return ngoRepository.findByCity(city).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public NGOResponse createNGO(NGORequest request) {
        if (request.getEmail() != null) {
            ngoRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
                throw new DuplicateResourceException("NGO", "email", request.getEmail());
            });
        }

        NGO ngo = NGO.builder()
                .ngoName(request.getNgoName())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .phone(request.getPhone())
                .email(request.getEmail())
                .description(request.getDescription())
                .registrationNumber(request.getRegistrationNumber())
                .panNumber(request.getPanNumber())
                .website(request.getWebsite())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .verified(false)
                .build();

        ngo = ngoRepository.save(ngo);
        log.info("NGO created: {} ({})", ngo.getNgoName(), ngo.getNgoId());
        return mapToResponse(ngo);
    }

    @Transactional
    public NGOResponse verifyNGO(Long ngoId) {
        NGO ngo = ngoRepository.findById(ngoId)
                .orElseThrow(() -> new ResourceNotFoundException("NGO", "id", ngoId));
        ngo.setVerified(true);
        ngo = ngoRepository.save(ngo);
        log.info("NGO verified: {} ({})", ngo.getNgoName(), ngo.getNgoId());
        return mapToResponse(ngo);
    }

    // ==================== VOLUNTEER MANAGEMENT METHODS ====================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getNGOVolunteersList(String ngoEmail) {
        return volunteerRepository.findAllByNgoEmailOrderByJoinedDate(ngoEmail).stream()
                .map(this::mapVolunteerToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getNGOVolunteersByStatus(String ngoEmail, VolunteerStatus status) {
        return volunteerRepository.findByNgoEmailAndVolunteerStatus(ngoEmail, status).stream()
                .map(this::mapVolunteerToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getNGOVolunteerDetail(String ngoEmail, Long volunteerId) {
        Volunteer volunteer = volunteerRepository.findById(volunteerId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer", "id", volunteerId));

        // Verify ownership
        if (volunteer.getNgo() == null || volunteer.getNgo().getEmail() == null ||
                !volunteer.getNgo().getEmail().equalsIgnoreCase(ngoEmail)) {
            throw new AccessDeniedException("You can only view volunteers from your NGO");
        }

        return mapVolunteerToResponseWithTasks(volunteer);
    }

    @Transactional
    public Map<String, Object> updateVolunteerStatus(String ngoEmail, Long volunteerId, VolunteerStatus newStatus) {
        Volunteer volunteer = volunteerRepository.findById(volunteerId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer", "id", volunteerId));

        // Verify ownership
        if (volunteer.getNgo() == null || volunteer.getNgo().getEmail() == null ||
                !volunteer.getNgo().getEmail().equalsIgnoreCase(ngoEmail)) {
            throw new AccessDeniedException("You can only manage volunteers from your NGO");
        }

        volunteer.setVolunteerStatus(newStatus);
        volunteer = volunteerRepository.save(volunteer);
        log.info("Volunteer status updated: {} -> {}", volunteerId, newStatus);

        return mapVolunteerToResponse(volunteer);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getNGOVolunteerStats(String ngoEmail) {
        List<Volunteer> volunteers = volunteerRepository.findByNgoEmail(ngoEmail);

        long activeVolunteers = volunteers.stream()
                .filter(v -> v.getVolunteerStatus() == VolunteerStatus.ACTIVE)
                .count();

        long inactiveVolunteers = volunteers.stream()
                .filter(v -> v.getVolunteerStatus() == VolunteerStatus.INACTIVE)
                .count();

        int totalHours = volunteers.stream()
                .mapToInt(Volunteer::getHoursVolunteered)
                .sum();

        int totalTasksCompleted = volunteers.stream()
                .mapToInt(Volunteer::getTasksCompleted)
                .sum();

        List<TaskAssignment> activeTasks = taskAssignmentRepository
                .findByVolunteerNgoEmailAndStatus(ngoEmail, TaskStatus.IN_PROGRESS);

        return Map.of(
                "totalVolunteers", volunteers.size(),
                "activeVolunteers", activeVolunteers,
                "inactiveVolunteers", inactiveVolunteers,
                "totalHoursVolunteered", totalHours,
                "totalTasksCompleted", totalTasksCompleted,
                "ongoingTasks", activeTasks.size()
        );
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getNGOVolunteerSchedule(String ngoEmail) {
        return taskAssignmentRepository.findByVolunteerNgoEmailOrderByAssignedDate(ngoEmail).stream()
                .map(task -> {
                    Map<String, Object> payload = new LinkedHashMap<>();
                    Volunteer volunteer = task.getVolunteer();
                    payload.put("taskId", task.getTaskId());
                    payload.put("volunteerId", volunteer.getVolunteerId());
                    payload.put("volunteerName", volunteer.getUser() != null ? volunteer.getUser().getName() : "Unknown");
                    payload.put("description", task.getDescription());
                    payload.put("status", task.getTaskStatus() != null ? task.getTaskStatus().name() : "ASSIGNED");
                    payload.put("assignedDate", task.getAssignedDate());
                    payload.put("completedDate", task.getCompletedDate());
                    payload.put("pickupId", task.getPickupRequest() != null ? task.getPickupRequest().getPickupId() : null);
                    return payload;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getVolunteerTaskHistory(String ngoEmail, Long volunteerId) {
        Volunteer volunteer = volunteerRepository.findById(volunteerId)
                .orElseThrow(() -> new ResourceNotFoundException("Volunteer", "id", volunteerId));

        // Verify ownership
        if (volunteer.getNgo() == null || volunteer.getNgo().getEmail() == null ||
                !volunteer.getNgo().getEmail().equalsIgnoreCase(ngoEmail)) {
            throw new AccessDeniedException("You can only view tasks for volunteers from your NGO");
        }

        return taskAssignmentRepository.findByVolunteerIdOrderByAssignedDate(volunteerId).stream()
                .map(task -> {
                    Map<String, Object> payload = new LinkedHashMap<>();
                    payload.put("taskId", task.getTaskId());
                    payload.put("description", task.getDescription());
                    payload.put("status", task.getTaskStatus() != null ? task.getTaskStatus().name() : "ASSIGNED");
                    payload.put("assignedDate", task.getAssignedDate());
                    payload.put("completedDate", task.getCompletedDate());
                    payload.put("pickupId", task.getPickupRequest() != null ? task.getPickupRequest().getPickupId() : null);
                    return payload;
                })
                .collect(Collectors.toList());
    }

    private Map<String, Object> mapVolunteerToResponse(Volunteer volunteer) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("volunteerId", volunteer.getVolunteerId());
        payload.put("userId", volunteer.getUser() != null ? volunteer.getUser().getUserId() : null);
        payload.put("name", volunteer.getUser() != null ? volunteer.getUser().getName() : "Volunteer");
        payload.put("email", volunteer.getUser() != null ? volunteer.getUser().getEmail() : null);
        payload.put("phone", volunteer.getUser() != null ? volunteer.getUser().getPhone() : null);
        payload.put("status", volunteer.getVolunteerStatus() != null ? volunteer.getVolunteerStatus().name() : "ACTIVE");
        payload.put("joinedDate", volunteer.getJoinedDate());
        payload.put("hoursVolunteered", volunteer.getHoursVolunteered());
        payload.put("tasksCompleted", volunteer.getTasksCompleted());
        return payload;
    }

    private Map<String, Object> mapVolunteerToResponseWithTasks(Volunteer volunteer) {
        Map<String, Object> payload = mapVolunteerToResponse(volunteer);

        List<Map<String, Object>> tasks = taskAssignmentRepository.findByVolunteerIdOrderByAssignedDate(volunteer.getVolunteerId())
                .stream()
                .map(task -> {
                    Map<String, Object> taskMap = new LinkedHashMap<>();
                    taskMap.put("taskId", task.getTaskId());
                    taskMap.put("description", task.getDescription());
                    taskMap.put("status", task.getTaskStatus() != null ? task.getTaskStatus().name() : "ASSIGNED");
                    taskMap.put("assignedDate", task.getAssignedDate());
                    taskMap.put("completedDate", task.getCompletedDate());
                    return taskMap;
                })
                .collect(Collectors.toList());

        payload.put("taskHistory", tasks);
        return payload;
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
                .activeCampaigns(ngo.getCampaigns() != null ? ngo.getCampaigns().size() : 0)
                .build();
    }
}