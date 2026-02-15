package com.college.admission.model;
import jakarta.persistence.*;
import lombok.Data;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Payment")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer paymentID;

    @ManyToOne
    @JoinColumn(name = "ApplicationID")
    private Application application;

    @Column(precision = 10, scale = 2)
    private BigDecimal amount;

    private LocalDate paymentDate;

    @ManyToOne
    @JoinColumn(name = "PaymentMethodID")
    private PaymentMethod paymentMethod;
}
