// File: src/main/java/com/healthcare/dto/AppointmentRequest.java
package com.healthcare.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AppointmentRequest {

    @NotNull(message = "Patient ID is required")
    private Integer patientId;

    @NotNull(message = "Doctor ID is required")
    private Integer doctorId;

    @NotNull(message = "Date and time is required")
    private LocalDateTime dateTime;

    private String reason;

    private String status;  // Optional - defaults to SCHEDULED
}