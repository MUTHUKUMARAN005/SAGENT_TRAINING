// src/main/java/com/daansetu/dto/response/NGOResponse.java
package com.daansetu.dto.response;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NGOResponse {
    private Long ngoId;
    private String ngoName;
    private String address;
    private String city;
    private String state;
    private String email;
    private String phone;
    private String description;
    private boolean verified;
    private Double latitude;
    private Double longitude;
    private int activeCampaigns;
}