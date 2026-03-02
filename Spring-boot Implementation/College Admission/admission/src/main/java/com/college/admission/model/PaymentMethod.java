package com.college.admission.model;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "PaymentMethod")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethod {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer paymentMethodID;

    @Column(nullable = false)
    private String methodName;
}