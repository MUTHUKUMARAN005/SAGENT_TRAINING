package com.college.admission.model;
import jakarta.persistence.*;
import lombok.Data;

import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "Document")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer documentID;

    @ManyToOne
    @JoinColumn(name = "StudentID")
    private Student student;

    private String documentType;
    private String filePath;
    private LocalDate uploadDate;
}