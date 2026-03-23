package com.daansetu.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VolunteerRequest {

    @NotNull
    private Long userId;

    private Long ngoId;
    private String skills;
    private String availability;
    private String preferredCity;
    private String motivation;
}