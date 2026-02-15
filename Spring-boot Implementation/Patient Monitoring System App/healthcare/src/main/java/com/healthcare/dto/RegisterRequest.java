// File: src/main/java/com/healthcare/dto/RegisterRequest.java
package com.healthcare.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @Email(message = "Valid email is required")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Role is required")
    private String role;

    // Patient specific fields
    private String dateOfBirth;
    private String contactNumber;
    private String emergencyContact;

    // Doctor specific fields
    private String licenseNumber;
}