// src/main/java/com/daansetu/dto/request/NGORequest.java
package com.daansetu.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class NGORequest {
    @NotBlank
    private String ngoName;
    private String address;
    @NotBlank
    private String city;
    private String state;
    private String phone;
    @Email
    private String email;
    private String description;
    private String registrationNumber;
    private String panNumber;
    private String website;
    private Double latitude;
    private Double longitude;
}