package com.college.admission.model;
import jakarta.persistence.*;
import lombok.Data;

import lombok.*;

@Entity
@Table(name = "Course")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer courseID;

    @Column(nullable = false)
    private String courseName;

    @ManyToOne
    @JoinColumn(name = "DepartmentID")
    private Department department;

    private Integer credits;
    private String duration;
}