// model/Fine.java
package com.library.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "Fine")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Fine {
    @Id
    @Column(name = "FineID", length = 50)
    private String fineId;

    @ManyToOne
    @JoinColumn(name = "MemberID", nullable = false)
    private Member member;

    @ManyToOne
    @JoinColumn(name = "RecordID", nullable = false)
    private BorrowingRecord record;

    @Column(name = "Amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "Status", length = 50, nullable = false)
    private String status;

    @Column(name = "DueDate", nullable = false)
    private LocalDate dueDate;

    @Column(name = "PaidDate")
    private LocalDate paidDate;
}