// src/main/java/com/daansetu/repository/EmailVerificationTokenRepository.java
package com.daansetu.repository;

import com.daansetu.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByToken(String token);
    Optional<EmailVerificationToken> findByUserUserIdAndUsedFalse(Long userId);
    java.util.List<EmailVerificationToken> findAllByUserUserIdAndUsedFalseOrderByCreatedAtDesc(Long userId);
    void deleteByUserUserId(Long userId);
}