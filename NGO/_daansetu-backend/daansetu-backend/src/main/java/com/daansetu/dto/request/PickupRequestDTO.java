// src/main/java/com/daansetu/dto/request/PickupRequestDTO.java
package com.daansetu.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class PickupRequestDTO {
    @NotNull(message = "Donation ID is required")
    private Long donationId;
    
    @NotBlank(message = "Address is required")
    private String address;
    
    @NotNull(message = "Pickup date is required")
    @JsonFormat(pattern = "yyyy-MM-dd", shape = JsonFormat.Shape.STRING)
    @JsonDeserialize(using = LocalDateDeserializer.class)
    private LocalDate pickupDate;
    
    @NotBlank(message = "Time slot is required")
    private String timeSlot;
    
    @NotBlank(message = "Contact phone is required")
    private String contactPhone;
    
    private String notes;
    private Double latitude;
    private Double longitude;
    private List<String> items;
}