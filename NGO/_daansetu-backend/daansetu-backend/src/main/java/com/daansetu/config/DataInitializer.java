// src/main/java/com/daansetu/config/DataInitializer.java
package com.daansetu.config;

import com.daansetu.entity.User;
import com.daansetu.repository.UserRepository;
import com.daansetu.service.AdminMenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final AdminMenuService adminMenuService;
    private final JdbcTemplate jdbcTemplate;

    @Bean
    public CommandLineRunner fixPasswords() {
        return args -> {
            List<User> users = userRepository.findAll();

            if (users.isEmpty()) {
                log.info("No users found. Skipping password fix.");
                return;
            }

            String testPassword = "password123";
            boolean needsFix = false;

            // Check if first user's password is valid BCrypt
            User firstUser = users.get(0);
            try {
                boolean matches = passwordEncoder.matches(testPassword, firstUser.getPassword());
                if (matches) {
                    log.info("✅ Passwords are already correct. No fix needed.");
                    return;
                }
            } catch (Exception e) {
                needsFix = true;
                log.warn("⚠️ Password hash is invalid. Fixing all passwords...");
            }

            if (!needsFix) {
                // Password doesn't match, might be wrong hash
                needsFix = true;
                log.warn("⚠️ Password doesn't match 'password123'. Resetting all passwords...");
            }

            // Generate correct hash
            String correctHash = passwordEncoder.encode(testPassword);
            log.info("Generated BCrypt hash: {}", correctHash);
            log.info("Hash length: {}", correctHash.length());

            // Update all users
            int updated = 0;
            for (User user : users) {
                user.setPassword(correctHash);
                userRepository.save(user);
                updated++;
            }

            log.info("✅ Fixed passwords for {} users. Password: '{}'", updated, testPassword);

            // Verify
            User verifyUser = userRepository.findByEmail("admin@daansetu.org").orElse(null);
            if (verifyUser != null) {
                boolean verified = passwordEncoder.matches(testPassword, verifyUser.getPassword());
                log.info("✅ Verification: admin@daansetu.org login with '{}' = {}", testPassword, verified);
            }
        };
    }

    @Bean
    public CommandLineRunner seedAdminMenuItems() {
        return args -> adminMenuService.seedDefaultsIfMissing();
    }

    @Bean
    public CommandLineRunner ensureOtpSchemaCompatibility() {
        return args -> {
            try {
                String phoneNullable = jdbcTemplate.queryForObject(
                        """
                        SELECT IS_NULLABLE
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = 'otp_records'
                          AND COLUMN_NAME = 'phone'
                        """,
                        String.class
                );

                if ("NO".equalsIgnoreCase(phoneNullable)) {
                    jdbcTemplate.execute("ALTER TABLE otp_records MODIFY COLUMN phone VARCHAR(32) NULL");
                    log.info("Updated otp_records.phone to allow NULL for email-based OTP records");
                }

                String purposeDataType = jdbcTemplate.queryForObject(
                        """
                        SELECT DATA_TYPE
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = 'otp_records'
                          AND COLUMN_NAME = 'purpose'
                        """,
                        String.class
                );

                Integer purposeMaxLength = jdbcTemplate.queryForObject(
                        """
                        SELECT CHARACTER_MAXIMUM_LENGTH
                        FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = 'otp_records'
                          AND COLUMN_NAME = 'purpose'
                        """,
                        Integer.class
                );

                boolean needsPurposeUpgrade =
                        "enum".equalsIgnoreCase(purposeDataType)
                                || (purposeMaxLength != null && purposeMaxLength < 20);

                if (needsPurposeUpgrade) {
                    jdbcTemplate.execute("ALTER TABLE otp_records MODIFY COLUMN purpose VARCHAR(32) NOT NULL");
                    log.info("Updated otp_records.purpose to VARCHAR(32) for full OTP purpose support");
                }
            } catch (Exception error) {
                log.warn("Could not run otp_records compatibility migration: {}", error.getMessage());
            }
        };
    }
}
