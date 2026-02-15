package com.college.admission.model;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Login")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Login {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer loginID;

    @ManyToOne
    @JoinColumn(name = "StudentID")
    private Student student;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String passwordHash;
}