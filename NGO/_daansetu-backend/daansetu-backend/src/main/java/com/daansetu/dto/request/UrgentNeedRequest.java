package com.daansetu.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UrgentNeedRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String message;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
}