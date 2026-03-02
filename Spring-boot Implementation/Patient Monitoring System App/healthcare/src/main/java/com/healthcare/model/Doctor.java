// File: src/main/java/com/healthcare/model/Doctor.java
package com.healthcare.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "doctor")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {
    @Id
    @Column(name = "doctor_id")
    private Integer doctorId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "doctor_id")
    private User user;

    @Column(name = "license_number", nullable = false, unique = true)
    private String licenseNumber;

    @Column(nullable = false)
    private String name;
}