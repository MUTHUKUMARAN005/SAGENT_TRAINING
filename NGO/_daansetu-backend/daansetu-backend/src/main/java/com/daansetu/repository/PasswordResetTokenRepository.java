// src/main/java/com/daansetu/repository/PasswordResetTokenRepository.java
package com.daansetu.repository;

import com.daansetu.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    Optional<PasswordResetToken> findTopByUserUserIdAndOtpAndUsedFalseOrderByCreatedAtDesc(Long userId, String otp);
    Optional<PasswordResetToken> findTopByUserUserIdAndUsedFalseOrderByCreatedAtDesc(Long userId);
    Optional<PasswordResetToken> findTopByUserUserIdAndOtpVerifiedTrueAndUsedFalseOrderByCreatedAtDesc(Long userId);
    List<PasswordResetToken> findAllByUserUserIdAndUsedFalseOrderByCreatedAtDesc(Long userId);
    void deleteByUserUserId(Long userId);
}