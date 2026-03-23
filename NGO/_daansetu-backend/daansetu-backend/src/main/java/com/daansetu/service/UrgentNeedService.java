package com.daansetu.service;

import com.daansetu.dto.request.UrgentNeedRequest;
import com.daansetu.dto.response.UrgentNeedResponse;
import com.daansetu.entity.UrgentNeed;
import com.daansetu.entity.User;
import com.daansetu.enums.UrgentStatus;
import com.daansetu.exception.BadRequestException;
import com.daansetu.exception.ResourceNotFoundException;
import com.daansetu.repository.UrgentNeedRepository;
import com.daansetu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UrgentNeedService {

    private final UrgentNeedRepository urgentNeedRepository;
    private final UserRepository userRepository;

    @Transactional
    public UrgentNeedResponse createForNgo(String ngoEmail, UrgentNeedRequest request) {
        User ngoUser = userRepository.findByEmail(ngoEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", ngoEmail));

        validateWindow(request.getStartTime(), request.getEndTime());

        UrgentNeed urgentNeed = UrgentNeed.builder()
                .admin(ngoUser)
                .title(request.getTitle().trim())
                .message(request.getMessage().trim())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .urgentStatus(UrgentStatus.APPROVED)
                .build();

        urgentNeed = urgentNeedRepository.save(urgentNeed);
        log.info("Urgent need created by NGO {}: {}", ngoEmail, urgentNeed.getUrgentId());
        return toResponse(urgentNeed);
    }

    @Transactional(readOnly = true)
    public List<UrgentNeedResponse> getMine(String ngoEmail) {
        User ngoUser = userRepository.findByEmail(ngoEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", ngoEmail));

        return urgentNeedRepository.findByAdminOrderByCreatedAtDesc(ngoUser)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UrgentNeedResponse updateForNgo(String ngoEmail, Long urgentId, UrgentNeedRequest request) {
        User ngoUser = userRepository.findByEmail(ngoEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", ngoEmail));

        UrgentNeed urgentNeed = urgentNeedRepository.findById(urgentId)
                .orElseThrow(() -> new ResourceNotFoundException("UrgentNeed", "id", urgentId));

        assertOwner(ngoUser, urgentNeed);
        validateWindow(request.getStartTime(), request.getEndTime());

        urgentNeed.setTitle(request.getTitle().trim());
        urgentNeed.setMessage(request.getMessage().trim());
        urgentNeed.setStartTime(request.getStartTime());
        urgentNeed.setEndTime(request.getEndTime());
        urgentNeed.setUrgentStatus(UrgentStatus.APPROVED);

        urgentNeed = urgentNeedRepository.save(urgentNeed);
        log.info("Urgent need updated by NGO {}: {}", ngoEmail, urgentId);
        return toResponse(urgentNeed);
    }

    @Transactional
    public void deleteForNgo(String ngoEmail, Long urgentId) {
        User ngoUser = userRepository.findByEmail(ngoEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", ngoEmail));

        UrgentNeed urgentNeed = urgentNeedRepository.findById(urgentId)
                .orElseThrow(() -> new ResourceNotFoundException("UrgentNeed", "id", urgentId));

        assertOwner(ngoUser, urgentNeed);
        urgentNeedRepository.delete(urgentNeed);
        log.info("Urgent need deleted by NGO {}: {}", ngoEmail, urgentId);
    }

    @Transactional(readOnly = true)
    public List<UrgentNeedResponse> getActiveForHomepage() {
        LocalDateTime now = LocalDateTime.now();
        return urgentNeedRepository.findActiveForHomepage(UrgentStatus.APPROVED, now)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private void assertOwner(User ngoUser, UrgentNeed urgentNeed) {
        Long ownerId = urgentNeed.getAdmin() != null ? urgentNeed.getAdmin().getUserId() : null;
        if (ownerId == null || !ownerId.equals(ngoUser.getUserId())) {
            throw new AccessDeniedException("You can only manage urgent needs created by your NGO account");
        }
    }

    private void validateWindow(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime != null && endTime != null && endTime.isBefore(startTime)) {
            throw new BadRequestException("End time cannot be earlier than start time");
        }
    }

    private UrgentNeedResponse toResponse(UrgentNeed urgentNeed) {
        User owner = urgentNeed.getAdmin();
        return UrgentNeedResponse.builder()
                .urgentId(urgentNeed.getUrgentId())
                .title(urgentNeed.getTitle())
                .message(urgentNeed.getMessage())
                .startTime(urgentNeed.getStartTime())
                .endTime(urgentNeed.getEndTime())
                .createdAt(urgentNeed.getCreatedAt())
                .urgentStatus(urgentNeed.getUrgentStatus())
                .ngoUserId(owner != null ? owner.getUserId() : null)
                .ngoName(owner != null ? owner.getName() : null)
                .ngoEmail(owner != null ? owner.getEmail() : null)
                .build();
    }
}
