// File: src/main/java/com/healthcare/model/Patient.java
package com.healthcare.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "patient")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Patient {
    @Id
    @Column(name = "patient_id")
    private Integer patientId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "patient_id")
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(name = "contact_number")
    private String contactNumber;

    @Column(name = "emergency_contact")
    private String emergencyContact;
}