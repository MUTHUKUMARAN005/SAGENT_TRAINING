// src/main/java/com/daansetu/dto/response/AuthResponse.java
package com.daansetu.dto.response;

import com.daansetu.enums.UserRole;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private UserRole role;
    private boolean emailVerified;
    private boolean phoneVerified;
    private boolean verificationRequired;
}