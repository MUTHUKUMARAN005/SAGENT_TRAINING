package com.example.library.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class BorrowingRecord {

    @Id
    private String recordID;

    private String memberID;
    private String copyID;

    private LocalDate borrowDate;
    private LocalDate dueDate;
    private LocalDate returnDate;

    private String status;
}
