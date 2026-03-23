// src/main/java/com/daansetu/service/CampaignService.java
package com.daansetu.service;

import com.daansetu.dto.request.CampaignRequest;
import com.daansetu.dto.response.CampaignResponse;
import com.daansetu.dto.response.PageResponse;
import com.daansetu.entity.Campaign;
import com.daansetu.entity.NGO;
import com.daansetu.enums.CampaignStatus;
import com.daansetu.exception.BadRequestException;
import com.daansetu.exception.ResourceNotFoundException;
import com.daansetu.repository.CampaignRepository;
import com.daansetu.repository.NGORepository;
import com.daansetu.repository.TaskAssignmentRepository;
import com.daansetu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final NGORepository ngoRepository;
    private final UserRepository userRepository;
        private final TaskAssignmentRepository taskAssignmentRepository;

        private static final Map<Long, List<Map<String, Object>>> CAMPAIGN_UPDATES = new ConcurrentHashMap<>();
        private static final AtomicLong CAMPAIGN_UPDATE_ID_SEQUENCE = new AtomicLong(1000);

    @Transactional(readOnly = true)
    public PageResponse<CampaignResponse> getAllCampaigns(int page, int size, String search,
                                                          String status, String sort) {
        Sort sorting = Sort.by(Sort.Direction.DESC, "campaignId");
        if ("oldest".equals(sort)) sorting = Sort.by(Sort.Direction.ASC, "startDate");
        else if ("most_funded".equals(sort)) sorting = Sort.by(Sort.Direction.DESC, "collectedAmount");
        else if ("ending_soon".equals(sort)) sorting = Sort.by(Sort.Direction.ASC, "endDate");

        Pageable pageable = PageRequest.of(page, size, sorting);
        CampaignStatus campaignStatus = status != null ? CampaignStatus.valueOf(status.toUpperCase()) : CampaignStatus.ACTIVE;

        Page<Campaign> campaigns;
        if (search != null && !search.isBlank()) {
            campaigns = campaignRepository.searchCampaigns(campaignStatus, search, pageable);
        } else {
            campaigns = campaignRepository.findByCampaignStatus(campaignStatus, pageable);
        }

        List<CampaignResponse> content = campaigns.getContent().stream()
                .map(this::mapToResponse).collect(Collectors.toList());

        return PageResponse.<CampaignResponse>builder()
                .content(content)
                .page(campaigns.getNumber())
                .size(campaigns.getSize())
                .totalElements(campaigns.getTotalElements())
                .totalPages(campaigns.getTotalPages())
                .last(campaigns.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<CampaignResponse> getCampaignsByUser(Long userId, int page, int size) {
        String email = userRepository.findById(userId)
                .map(com.daansetu.entity.User::getEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        String userName = userRepository.findById(userId)
                .map(com.daansetu.entity.User::getName)
                .map(String::trim)
                .orElse("");

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "campaignId"));
        Page<Campaign> campaigns = campaignRepository.findByNgoAccessContext(userId, email, pageable);

        if (campaigns.isEmpty()) {
            try {
                                NGO ngo = ngoRepository.findByEmailIgnoreCase(email)
                        .orElseThrow(() -> new ResourceNotFoundException("NGO", "email", email));
                campaigns = campaignRepository.findByNgoNgoId(ngo.getNgoId(), pageable);
            } catch (ResourceNotFoundException _ignored) {
                // Return empty page for users with no explicit NGO record.
            }
        }

                if (campaigns.isEmpty() && !userName.isEmpty()) {
                        NGO ngoByName = ngoRepository.findByNgoNameIgnoreCase(userName).stream().findFirst().orElse(null);
                        if (ngoByName != null) {
                                campaigns = campaignRepository.findByNgoNgoId(ngoByName.getNgoId(), pageable);
                        }
                }

        List<CampaignResponse> content = campaigns.getContent().stream()
                .map(this::mapToResponse).collect(Collectors.toList());

        return PageResponse.<CampaignResponse>builder()
                .content(content)
                .page(campaigns.getNumber())
                .size(campaigns.getSize())
                .totalElements(campaigns.getTotalElements())
                .totalPages(campaigns.getTotalPages())
                .last(campaigns.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public CampaignResponse getCampaignById(Long id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign", "id", id));
        return mapToResponse(campaign);
    }

    @Transactional(readOnly = true)
    public List<CampaignResponse> getFeaturedCampaigns() {
        return campaignRepository.findTop6ByCampaignStatusOrderByCollectedAmountDesc(CampaignStatus.ACTIVE)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public CampaignResponse createCampaign(CampaignRequest request, String actorEmail, boolean isAdmin) {
        NGO ngo = resolveNgoForMutation(request, actorEmail, isAdmin);
        var actorUser = userRepository.findByEmailIgnoreCase(actorEmail).orElse(null);

        Campaign campaign = Campaign.builder()
                .ngo(ngo)
                .admin(actorUser)
                .title(request.getTitle())
                .description(request.getDescription())
                .donationType(request.getDonationType())
                .targetAmount(request.getTargetAmount())
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .endDate(request.getEndDate())
                .image(request.getImage())
                .city(request.getCity())
                .state(request.getState())
                .campaignStatus(CampaignStatus.ACTIVE)
                .build();

        campaign = campaignRepository.save(campaign);
        return mapToResponse(campaign);
    }

    @Transactional
    public CampaignResponse updateCampaign(Long id, CampaignRequest request, String actorEmail, boolean isAdmin) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign", "id", id));
        assertCampaignOwnership(campaign, actorEmail, isAdmin);

        if (request.getTitle() != null) campaign.setTitle(request.getTitle());
        if (request.getDescription() != null) campaign.setDescription(request.getDescription());
        if (request.getTargetAmount() != null) campaign.setTargetAmount(request.getTargetAmount());
        if (request.getEndDate() != null) campaign.setEndDate(request.getEndDate());
        if (request.getImage() != null) campaign.setImage(request.getImage());
        if (request.getCity() != null) campaign.setCity(request.getCity());
        if (request.getState() != null) campaign.setState(request.getState());

        campaign = campaignRepository.save(campaign);
        return mapToResponse(campaign);
    }

    @Transactional
    public CampaignResponse updateCampaignStatus(Long id, CampaignStatus status) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign", "id", id));
        campaign.setCampaignStatus(status);
        campaign = campaignRepository.save(campaign);
        return mapToResponse(campaign);
    }

    @Transactional
    public void deleteCampaign(Long id, String actorEmail, boolean isAdmin) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign", "id", id));
        assertCampaignOwnership(campaign, actorEmail, isAdmin);
        campaignRepository.delete(campaign);
    }

        @Transactional(readOnly = true)
        public List<Map<String, Object>> getCampaignUpdates(Long campaignId) {
                campaignRepository.findById(campaignId)
                                .orElseThrow(() -> new ResourceNotFoundException("Campaign", "id", campaignId));

                List<Map<String, Object>> updates = CAMPAIGN_UPDATES.getOrDefault(campaignId, List.of());
                return updates.stream()
                                .map(item -> new LinkedHashMap<>(item))
                                .collect(Collectors.toList());
        }

        @Transactional
        public Map<String, Object> createCampaignUpdate(Long campaignId, Map<String, Object> payload, String actorEmail, boolean isAdmin) {
                Campaign campaign = campaignRepository.findById(campaignId)
                                .orElseThrow(() -> new ResourceNotFoundException("Campaign", "id", campaignId));
                assertCampaignOwnership(campaign, actorEmail, isAdmin);

                String message = String.valueOf(payload.getOrDefault("message", "")).trim();
                if (message.isBlank()) {
                        throw new BadRequestException("message is required");
                }

                Map<String, Object> update = new LinkedHashMap<>();
                update.put("id", CAMPAIGN_UPDATE_ID_SEQUENCE.incrementAndGet());
                update.put("campaign_id", campaignId);
                update.put("ngo_name", campaign.getNgo() != null ? campaign.getNgo().getNgoName() : "Campaign NGO");
                update.put("message", message);
                update.put("impact_count", parseInt(payload.get("impactCount"), 0));
                update.put("impact_label", String.valueOf(payload.getOrDefault("impactLabel", "")).trim());
                update.put("image_url", String.valueOf(payload.getOrDefault("imageUrl", "")).trim());
                update.put("is_pinned", false);
                update.put("pinned_at", null);
                update.put("posted_at", LocalDateTime.now().toString());
                update.put("posted_by", actorEmail);

                List<Map<String, Object>> updates = new ArrayList<>(CAMPAIGN_UPDATES.getOrDefault(campaignId, List.of()));
                updates.add(0, update);
                CAMPAIGN_UPDATES.put(campaignId, updates);
                return new LinkedHashMap<>(update);
        }

        @Transactional
        public Map<String, Object> updateCampaignUpdate(Long campaignId, Long updateId, Map<String, Object> payload, String actorEmail, boolean isAdmin) {
                Campaign campaign = campaignRepository.findById(campaignId)
                                .orElseThrow(() -> new ResourceNotFoundException("Campaign", "id", campaignId));
                assertCampaignOwnership(campaign, actorEmail, isAdmin);

                List<Map<String, Object>> updates = new ArrayList<>(CAMPAIGN_UPDATES.getOrDefault(campaignId, List.of()));
                Map<String, Object> target = updates.stream()
                                .filter(item -> String.valueOf(item.get("id")).equals(String.valueOf(updateId)))
                                .findFirst()
                                .orElseThrow(() -> new ResourceNotFoundException("CampaignUpdate", "id", updateId));

                String message = String.valueOf(payload.getOrDefault("message", target.getOrDefault("message", ""))).trim();
                if (message.isBlank()) {
                        throw new BadRequestException("message is required");
                }

                target.put("message", message);
                target.put("impact_count", parseInt(payload.get("impactCount"), parseInt(target.get("impact_count"), 0)));
                target.put("impact_label", String.valueOf(payload.getOrDefault("impactLabel", target.getOrDefault("impact_label", ""))).trim());

                CAMPAIGN_UPDATES.put(campaignId, updates);
                return new LinkedHashMap<>(target);
        }

        @Transactional
        public void deleteCampaignUpdate(Long campaignId, Long updateId, String actorEmail, boolean isAdmin) {
                Campaign campaign = campaignRepository.findById(campaignId)
                                .orElseThrow(() -> new ResourceNotFoundException("Campaign", "id", campaignId));
                assertCampaignOwnership(campaign, actorEmail, isAdmin);

                List<Map<String, Object>> updates = new ArrayList<>(CAMPAIGN_UPDATES.getOrDefault(campaignId, List.of()));
                boolean removed = updates.removeIf(item -> String.valueOf(item.get("id")).equals(String.valueOf(updateId)));
                if (!removed) {
                        throw new ResourceNotFoundException("CampaignUpdate", "id", updateId);
                }
                CAMPAIGN_UPDATES.put(campaignId, updates);
        }

        @Transactional
        public Map<String, Object> setCampaignUpdatePinned(Long campaignId, Long updateId, boolean pinned, String actorEmail, boolean isAdmin) {
                Campaign campaign = campaignRepository.findById(campaignId)
                                .orElseThrow(() -> new ResourceNotFoundException("Campaign", "id", campaignId));
                assertCampaignOwnership(campaign, actorEmail, isAdmin);

                List<Map<String, Object>> updates = new ArrayList<>(CAMPAIGN_UPDATES.getOrDefault(campaignId, List.of()));
                Map<String, Object> target = updates.stream()
                                .filter(item -> String.valueOf(item.get("id")).equals(String.valueOf(updateId)))
                                .findFirst()
                                .orElseThrow(() -> new ResourceNotFoundException("CampaignUpdate", "id", updateId));

                if (pinned) {
                        updates.forEach(item -> {
                                item.put("is_pinned", false);
                                item.put("pinned_at", null);
                        });
                }

                target.put("is_pinned", pinned);
                target.put("pinned_at", pinned ? LocalDateTime.now().toString() : null);

                CAMPAIGN_UPDATES.put(campaignId, updates);
                return new LinkedHashMap<>(target);
        }

        @Transactional(readOnly = true)
        public List<Map<String, Object>> getVolunteerLeaderboard(Long campaignId, int limit) {
                campaignRepository.findById(campaignId)
                                .orElseThrow(() -> new ResourceNotFoundException("Campaign", "id", campaignId));

                int safeLimit = Math.max(1, Math.min(limit, 50));
                List<Object[]> rows = taskAssignmentRepository.findVolunteerLeaderboardByCampaignId(campaignId);

                List<Map<String, Object>> leaderboard = new ArrayList<>();
                for (int i = 0; i < rows.size() && i < safeLimit; i++) {
                        Object[] row = rows.get(i);
                        Map<String, Object> item = new LinkedHashMap<>();
                        item.put("id", row[0]);
                        item.put("name", row[1]);
                        item.put("city", row[2]);
                        item.put("avatar", row[3]);
                        item.put("pickups", row[4]);
                        item.put("badge", leaderboardBadge(i));
                        leaderboard.add(item);
                }

                return leaderboard;
        }

        private String leaderboardBadge(int index) {
                if (index == 0) return "Gold";
                if (index == 1) return "Silver";
                if (index == 2) return "Bronze";
                return "Rising Star";
        }

        private int parseInt(Object value, int fallback) {
                if (value == null) return fallback;
                try {
                        return Integer.parseInt(String.valueOf(value).trim());
                } catch (NumberFormatException _error) {
                        return fallback;
                }
        }

    private NGO resolveNgoForMutation(CampaignRequest request, String actorEmail, boolean isAdmin) {
        if (isAdmin) {
            if (request.getNgoId() == null) {
                throw new BadRequestException("ngoId is required for admin campaign creation");
            }
            return ngoRepository.findById(request.getNgoId())
                    .orElseThrow(() -> new ResourceNotFoundException("NGO", "id", request.getNgoId()));
        }

        return ngoRepository.findByEmailIgnoreCase(actorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("NGO", "email", actorEmail));
    }

    private void assertCampaignOwnership(Campaign campaign, String actorEmail, boolean isAdmin) {
        if (isAdmin) return;

        Long actorUserId = userRepository.findByEmailIgnoreCase(actorEmail)
                .map(com.daansetu.entity.User::getUserId)
                .orElse(null);

        Long campaignAdminUserId = campaign.getAdmin() != null ? campaign.getAdmin().getUserId() : null;
        String campaignAdminEmail = campaign.getAdmin() != null ? campaign.getAdmin().getEmail() : null;
        String campaignNgoEmail = campaign.getNgo() != null ? campaign.getNgo().getEmail() : null;

        boolean matchesAdminUser = actorUserId != null && actorUserId.equals(campaignAdminUserId);
        boolean matchesAdminEmail = campaignAdminEmail != null && actorEmail != null
                && campaignAdminEmail.equalsIgnoreCase(actorEmail);
        boolean matchesNgoEmail = campaignNgoEmail != null && actorEmail != null
                && campaignNgoEmail.equalsIgnoreCase(actorEmail);

        if (!matchesAdminUser && !matchesAdminEmail && !matchesNgoEmail) {
            throw new AccessDeniedException("You can manage only your own NGO campaigns");
        }
    }

    private CampaignResponse mapToResponse(Campaign c) {
        BigDecimal targetAmount = c.getTargetAmount() != null ? c.getTargetAmount() : BigDecimal.ZERO;
        BigDecimal collectedAmount = c.getCollectedAmount() != null ? c.getCollectedAmount() : BigDecimal.ZERO;
        long daysLeft = c.getEndDate() != null ?
                ChronoUnit.DAYS.between(LocalDate.now(), c.getEndDate()) : 0;
        double percentage = targetAmount.doubleValue() > 0 ?
                (collectedAmount.doubleValue() / targetAmount.doubleValue()) * 100 : 0;

        return CampaignResponse.builder()
                .campaignId(c.getCampaignId())
                .title(c.getTitle())
                .description(c.getDescription())
                .donationType(c.getDonationType())
                .targetAmount(targetAmount)
                .collectedAmount(collectedAmount)
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .campaignStatus(c.getCampaignStatus())
                .image(c.getImage())
                .city(c.getCity())
                .state(c.getState())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .donorsCount(c.getDonorsCount())
                .ngoName(c.getNgo() != null ? c.getNgo().getNgoName() : null)
                .ngoId(c.getNgo() != null ? c.getNgo().getNgoId() : null)
                .ngoAddress(c.getNgo() != null ? c.getNgo().getAddress() : null)
                .ngoLatitude(c.getNgo() != null ? c.getNgo().getLatitude() : null)
                .ngoLongitude(c.getNgo() != null ? c.getNgo().getLongitude() : null)
                .percentageFunded(Math.min(percentage, 100))
                .daysLeft(Math.max(daysLeft, 0))
                .build();
    }
}
