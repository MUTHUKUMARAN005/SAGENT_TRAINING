package com.college.admission.model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.*;

@Entity
@Table(name = "AcademicRecord")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AcademicRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer recordID;

    @ManyToOne
    @JoinColumn(name = "StudentID")
    private Student student;

    private String grade;
    private Integer year;
    private String institution;
}
