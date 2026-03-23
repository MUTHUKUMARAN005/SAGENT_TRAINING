// src/main/java/com/daansetu/dto/request/RegisterRequest.java
package com.daansetu.dto.request;

import com.daansetu.enums.UserRole;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank @Size(min = 2, max = 100)
    private String name;

    @NotBlank @Email
    private String email;

    @NotBlank @Size(min = 6, max = 100)
    private String password;

    private String phone;
    private String address;
    private String city;
    private Double latitude;
    private Double longitude;

    @NotNull
    private UserRole role;
}