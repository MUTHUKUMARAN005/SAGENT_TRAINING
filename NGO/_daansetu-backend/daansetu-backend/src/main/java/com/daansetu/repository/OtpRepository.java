// src/main/java/com/daansetu/repository/OtpRepository.java
package com.daansetu.repository;

import com.daansetu.entity.OtpRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpRecord, Long> {
    Optional<OtpRecord> findTopByPhoneAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(
            String phone, OtpRecord.OtpPurpose purpose);
    Optional<OtpRecord> findTopByEmailAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(
            String email, OtpRecord.OtpPurpose purpose);
    Optional<OtpRecord> findTopByPhoneAndEmailAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(
            String phone, String email, OtpRecord.OtpPurpose purpose);
    void deleteByEmailAndPurpose(String email, OtpRecord.OtpPurpose purpose);
    void deleteByPhoneAndPurpose(String phone, OtpRecord.OtpPurpose purpose);
    void deleteByEmail(String email);
    void deleteByPhone(String phone);
}