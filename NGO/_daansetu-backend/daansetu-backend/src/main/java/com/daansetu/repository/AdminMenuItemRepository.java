package com.daansetu.repository;

import com.daansetu.entity.AdminMenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdminMenuItemRepository extends JpaRepository<AdminMenuItem, Long> {
    List<AdminMenuItem> findAllByOrderBySortOrderAscMenuIdAsc();
    List<AdminMenuItem> findByEnabledTrueOrderBySortOrderAscMenuIdAsc();
    boolean existsByMenuKeyIgnoreCase(String menuKey);
    Optional<AdminMenuItem> findByMenuKeyIgnoreCase(String menuKey);
    Optional<AdminMenuItem> findTopByOrderBySortOrderDescMenuIdDesc();
}
