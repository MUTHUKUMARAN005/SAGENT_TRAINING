package com.college.admission.model;
import jakarta.persistence.*;
import lombok.Data;

import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "Application")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer applicationID;

    @ManyToOne
    @JoinColumn(name = "StudentID")
    private Student student;

    @ManyToOne
    @JoinColumn(name = "CourseID")
    private Course course;

    private LocalDate submissionDate;

    @Column(columnDefinition = "VARCHAR(50) DEFAULT 'Pending'")
    private String status;
}
