package com.daansetu.repository;

import com.daansetu.entity.User;
import com.daansetu.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    long countByRole(UserRole role);
    Page<User> findByRole(UserRole role, Pageable pageable);
    Optional<User> findByPhone(String phone);

    @Query("SELECT COUNT(DISTINCT d.user) FROM Donation d WHERE d.donationStatus = 'COMPLETED'")
    long countUniqueDonors();
}
