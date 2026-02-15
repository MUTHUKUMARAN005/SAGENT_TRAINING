package com.college.admission.model;
// src/main/java/com/admission/model/College.java

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "College")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class College {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer collegeID;

    @Column(nullable = false)
    private String collegeName;

    @Column(nullable = false)
    private String location;
}