package com.daansetu.service;

import com.daansetu.entity.Donation;
import com.daansetu.entity.DonationProof;
import com.daansetu.entity.User;
import com.daansetu.enums.ProofType;
import com.daansetu.enums.UserRole;
import com.daansetu.exception.BadRequestException;
import com.daansetu.exception.ResourceNotFoundException;
import com.daansetu.repository.DonationProofRepository;
import com.daansetu.repository.DonationRepository;
import com.daansetu.repository.TaskAssignmentRepository;
import com.daansetu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProofService {

    private final DonationProofRepository proofRepository;
    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public Map<String, Object> uploadProof(Long donationId, String typeValue, MultipartFile file, Long actorUserId) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation", "id", donationId));

        User uploader = userRepository.findById(actorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", actorUserId));

        if (uploader.getRole() != UserRole.VOLUNTEER) {
            throw new AccessDeniedException("Only volunteer can upload pickup or delivery proof");
        }

        boolean assignedToDonation = taskAssignmentRepository
                .existsByPickupRequestDonationDonationIdAndVolunteerUserUserId(donationId, actorUserId);

        if (!assignedToDonation) {
            throw new AccessDeniedException("You can upload proof only for your assigned donation pickup");
        }

        ProofType type;
        try {
            type = ProofType.fromValue(typeValue);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("type must be either PICKUP or DELIVERY");
        }

        String storedPath = fileStorageService.storeFile(file, "proofs");

        DonationProof proof = proofRepository.findByDonationDonationIdAndType(donationId, type)
                .map(existing -> {
                    if (existing.getImageUrl() != null && !existing.getImageUrl().isBlank()) {
                        fileStorageService.deleteFile(existing.getImageUrl());
                    }
                    existing.setImageUrl(storedPath);
                    existing.setUploadedBy(uploader);
                    return existing;
                })
                .orElseGet(() -> DonationProof.builder()
                        .donation(donation)
                        .type(type)
                        .imageUrl(storedPath)
                        .uploadedBy(uploader)
                        .build());

        proof = proofRepository.save(proof);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", proof.getId());
        payload.put("donationId", donationId);
        payload.put("type", proof.getType().name());
        payload.put("imageUrl", "/api/files/" + proof.getImageUrl());
        payload.put("uploadedBy", uploader.getUserId());
        payload.put("uploadedAt", proof.getCreatedAt());
        payload.put("hasPickupProof", proofRepository.existsByDonationDonationIdAndType(donationId, ProofType.PICKUP));
        payload.put("hasDeliveryProof", proofRepository.existsByDonationDonationIdAndType(donationId, ProofType.DELIVERY));
        return payload;
    }

    @Transactional(readOnly = true)
    public boolean hasRequiredProofs(Long donationId) {
        return proofRepository.existsByDonationDonationIdAndType(donationId, ProofType.PICKUP)
                && proofRepository.existsByDonationDonationIdAndType(donationId, ProofType.DELIVERY);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getProofsByDonation(Long donationId) {
        return proofRepository.findByDonationDonationIdOrderByCreatedAtAsc(donationId)
                .stream()
                .map(proof -> {
                    Map<String, Object> payload = new LinkedHashMap<>();
                    payload.put("id", proof.getId());
                    payload.put("type", proof.getType().name());
                    payload.put("imageUrl", "/api/files/" + proof.getImageUrl());
                    payload.put("uploadedBy", proof.getUploadedBy() != null ? proof.getUploadedBy().getUserId() : null);
                    payload.put("uploadedAt", proof.getCreatedAt());
                    return payload;
                })
                .collect(Collectors.toList());
    }
}
