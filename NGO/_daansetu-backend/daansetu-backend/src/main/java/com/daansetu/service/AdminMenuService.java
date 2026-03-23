package com.daansetu.service;

import com.daansetu.dto.request.AdminMenuItemRequest;
import com.daansetu.dto.response.AdminMenuItemResponse;
import com.daansetu.entity.AdminMenuItem;
import com.daansetu.exception.BadRequestException;
import com.daansetu.exception.DuplicateResourceException;
import com.daansetu.exception.ResourceNotFoundException;
import com.daansetu.repository.AdminMenuItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminMenuService {

    private final AdminMenuItemRepository adminMenuItemRepository;

    @Transactional(readOnly = true)
    public List<AdminMenuItemResponse> getEnabledMenuItems() {
        return adminMenuItemRepository.findByEnabledTrueOrderBySortOrderAscMenuIdAsc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminMenuItemResponse> getAllMenuItems() {
        return adminMenuItemRepository.findAllByOrderBySortOrderAscMenuIdAsc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public void seedDefaultsIfMissing() {
        List<AdminMenuItem> defaults = List.of(
                buildItem("overview", "Dashboard", "/dashboard/admin", "home", 1),
                buildItem("campaigns", "Campaigns", "/dashboard/admin/campaigns", "target", 2),
                buildItem("donations", "Donations", "/dashboard/admin/donations", "dollar-sign", 3),
                buildItem("pickups", "Pickup Requests", "/dashboard/admin/pickups", "package", 4),
                buildItem("users", "Users", "/dashboard/admin/users", "users", 5),
                buildItem("volunteers", "Volunteers", "/dashboard/admin/volunteers", "truck", 6),
                buildItem("alerts", "Urgent Needs", "/dashboard/admin/alerts", "alert-triangle", 7),
                buildItem("reports", "Reports & Analytics", "/dashboard/admin/reports", "bar-chart-2", 8),
                buildItem("notifications", "Notifications", "/dashboard/admin/notifications", "bell", 9),
                buildItem("menu", "Menu Management", "/dashboard/admin/menu", "settings", 10)
        );

        int inserted = 0;
        for (AdminMenuItem item : defaults) {
            if (adminMenuItemRepository.existsByMenuKeyIgnoreCase(item.getMenuKey())) {
                continue;
            }
            adminMenuItemRepository.save(item);
            inserted++;
        }

        if (inserted > 0) {
            log.info("Seeded {} missing admin menu items", inserted);
        }
    }

    @Transactional
    public AdminMenuItemResponse createMenuItem(AdminMenuItemRequest request) {
        String menuKey = normalizeMenuKey(request.getKey());
        validatePath(request.getPath());

        if (adminMenuItemRepository.existsByMenuKeyIgnoreCase(menuKey)) {
            throw new DuplicateResourceException("Admin menu item", "key", menuKey);
        }

        int nextSortOrder = request.getSortOrder() != null
                ? request.getSortOrder()
                : adminMenuItemRepository.findTopByOrderBySortOrderDescMenuIdDesc()
                .map(item -> Math.max(1, item.getSortOrder() + 1))
                .orElse(1);

        AdminMenuItem created = adminMenuItemRepository.save(
                AdminMenuItem.builder()
                        .menuKey(menuKey)
                        .label(safeTrim(request.getLabel()))
                        .path(safeTrim(request.getPath()))
                        .iconKey(normalizeIconKey(request.getIconKey()))
                        .sortOrder(Math.max(1, nextSortOrder))
                        .enabled(request.getEnabled() == null || request.getEnabled())
                        .build()
        );

        return mapToResponse(created);
    }

    @Transactional
    public AdminMenuItemResponse updateMenuItem(Long menuId, AdminMenuItemRequest request) {
        AdminMenuItem existing = adminMenuItemRepository.findById(menuId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin menu item", "id", menuId));

        String menuKey = normalizeMenuKey(request.getKey());
        validatePath(request.getPath());

        adminMenuItemRepository.findByMenuKeyIgnoreCase(menuKey).ifPresent(other -> {
            if (!other.getMenuId().equals(menuId)) {
                throw new DuplicateResourceException("Admin menu item", "key", menuKey);
            }
        });

        existing.setMenuKey(menuKey);
        existing.setLabel(safeTrim(request.getLabel()));
        existing.setPath(safeTrim(request.getPath()));
        existing.setIconKey(normalizeIconKey(request.getIconKey()));
        existing.setSortOrder(Math.max(1, request.getSortOrder() != null ? request.getSortOrder() : existing.getSortOrder()));
        if (request.getEnabled() != null) {
            existing.setEnabled(request.getEnabled());
        }

        return mapToResponse(adminMenuItemRepository.save(existing));
    }

    @Transactional
    public void deleteMenuItem(Long menuId) {
        AdminMenuItem existing = adminMenuItemRepository.findById(menuId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin menu item", "id", menuId));
        adminMenuItemRepository.delete(existing);
    }

    private AdminMenuItem buildItem(String key, String label, String path, String iconKey, int sortOrder) {
        return AdminMenuItem.builder()
                .menuKey(key)
                .label(label)
                .path(path)
                .iconKey(iconKey)
                .sortOrder(sortOrder)
                .enabled(true)
                .build();
    }

    private AdminMenuItemResponse mapToResponse(AdminMenuItem item) {
        return AdminMenuItemResponse.builder()
                .id(item.getMenuId())
                .key(item.getMenuKey())
                .label(item.getLabel())
                .path(item.getPath())
                .iconKey(item.getIconKey())
                .sortOrder(item.getSortOrder())
                .enabled(item.isEnabled())
                .build();
    }

    private String normalizeMenuKey(String key) {
        String normalized = safeTrim(key).toLowerCase().replaceAll("[^a-z0-9_-]", "");
        if (normalized.isBlank()) {
            throw new BadRequestException("Menu key is required");
        }
        return normalized;
    }

    private String normalizeIconKey(String iconKey) {
        return safeTrim(iconKey).toLowerCase();
    }

    private void validatePath(String path) {
        String normalizedPath = safeTrim(path);
        if (normalizedPath.isBlank()) {
            throw new BadRequestException("Menu path is required");
        }
        if (!normalizedPath.startsWith("/dashboard/admin")) {
            throw new BadRequestException("Menu path must start with /dashboard/admin");
        }
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }
}
