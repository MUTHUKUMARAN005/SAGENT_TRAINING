package com.example.library.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
public class Fine {

    @Id
    private String fineID;

    private String memberID;
    private String recordID;

    private BigDecimal amount;

    private String status;

    private LocalDate dueDate;
    private LocalDate paidDate;
}
