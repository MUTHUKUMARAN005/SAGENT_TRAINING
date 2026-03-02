package com.healthcare.service;

import com.healthcare.dto.*;
import com.healthcare.model.*;
import com.healthcare.repository.*;
import com.healthcare.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.error("User not found: {}", request.getEmail());
                    return new RuntimeException("Invalid email or password");
                });

        log.info("User found: {}", user.getEmail());
        log.info("Stored hash: {}", user.getPasswordHash());
        log.info("Password length: {}", request.getPassword().length());

        // Debug: Test password matching
        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
        log.info("Password matches: {}", matches);

        if (!matches) {
            log.error("Password mismatch for user: {}", user.getEmail());
            throw new RuntimeException("Invalid email or password");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getUserId());
        log.info("Login successful for: {}", user.getEmail());

        String name = getName(user);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().name())
                .userId(user.getUserId())
                .name(name)
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.valueOf(request.getRole().toUpperCase()))
                .build();

        user = userRepository.save(user);

        if (user.getRole() == User.Role.PATIENT) {
            Patient patient = Patient.builder()
                    .user(user)
                    .name(request.getName())
                    .dateOfBirth(LocalDate.parse(request.getDateOfBirth()))
                    .contactNumber(request.getContactNumber())
                    .emergencyContact(request.getEmergencyContact())
                    .build();
            patientRepository.save(patient);
        } else if (user.getRole() == User.Role.DOCTOR) {
            Doctor doctor = Doctor.builder()
                    .user(user)
                    .name(request.getName())
                    .licenseNumber(request.getLicenseNumber())
                    .build();
            doctorRepository.save(doctor);
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getUserId());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().name())
                .userId(user.getUserId())
                .name(request.getName())
                .build();
    }

    private String getName(User user) {
        if (user.getRole() == User.Role.PATIENT) {
            return patientRepository.findById(user.getUserId())
                    .map(Patient::getName).orElse("Patient");
        } else if (user.getRole() == User.Role.DOCTOR) {
            return doctorRepository.findById(user.getUserId())
                    .map(Doctor::getName).orElse("Doctor");
        }
        return "Admin";
    }
}