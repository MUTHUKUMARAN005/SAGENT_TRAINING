package com.daansetu.dto.response;

import com.daansetu.enums.UrgentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UrgentNeedResponse {
    private Long urgentId;
    private String title;
    private String message;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
    private UrgentStatus urgentStatus;
    private Long ngoUserId;
    private String ngoName;
    private String ngoEmail;
}
