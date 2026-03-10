// File: src/main/java/com/healthcare/model/HealthRecord.java
package com.healthcare.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "health_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "record_id")
    private Integer recordId;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "blood_pressure_systolic")
    private Integer bloodPressureSystolic;

    @Column(name = "blood_pressure_diastolic")
    private Integer bloodPressureDiastolic;

    @Column(name = "oxygen_level")
    private BigDecimal oxygenLevel;

    private BigDecimal temperature;

    @Column(columnDefinition = "TEXT")
    private String notes;
}