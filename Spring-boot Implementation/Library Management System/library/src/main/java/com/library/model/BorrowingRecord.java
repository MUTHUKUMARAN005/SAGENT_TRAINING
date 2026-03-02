// model/BorrowingRecord.java
package com.library.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "BorrowingRecord")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class BorrowingRecord {
    @Id
    @Column(name = "RecordID", length = 50)
    private String recordId;

    @ManyToOne
    @JoinColumn(name = "MemberID", nullable = false)
    private Member member;

    @ManyToOne
    @JoinColumn(name = "CopyID", nullable = false)
    private BookCopy copy;

    @Column(name = "BorrowDate", nullable = false)
    private LocalDate borrowDate;

    @Column(name = "DueDate", nullable = false)
    private LocalDate dueDate;

    @Column(name = "ReturnDate")
    private LocalDate returnDate;

    @Column(name = "Status", length = 50, nullable = false)
    private String status;
}