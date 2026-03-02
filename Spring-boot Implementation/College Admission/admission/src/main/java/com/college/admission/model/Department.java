package com.college.admission.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Department")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer departmentID;

    @Column(nullable = false)
    private String departmentName;

    @ManyToOne
    @JoinColumn(name = "CollegeID")
    private College college;
}