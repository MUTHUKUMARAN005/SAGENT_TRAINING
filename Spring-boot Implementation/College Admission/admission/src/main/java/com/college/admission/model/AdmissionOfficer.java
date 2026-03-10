package com.college.admission.model;
import jakarta.persistence.*;
import lombok.Data;

import lombok.*;

@Entity
@Table(name = "AdmissionOfficer")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdmissionOfficer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer officerID;

    @Column(nullable = false)
    private String name;

    private String email;

    @ManyToOne
    @JoinColumn(name = "DepartmentID")
    private Department department;
}