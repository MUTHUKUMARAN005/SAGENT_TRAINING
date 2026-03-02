package com.college.admission.model;



import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Address")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer addressID;

    @ManyToOne
    @JoinColumn(name = "StudentID")
    private Student student;

    private String street;
    private String city;
    private String state;
    private String zipCode;
}