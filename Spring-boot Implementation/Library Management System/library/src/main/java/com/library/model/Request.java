// model/Request.java
package com.library.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "Request")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Request {
    @Id
    @Column(name = "RequestID", length = 50)
    private String requestId;

    @ManyToOne
    @JoinColumn(name = "MemberID", nullable = false)
    private Member member;

    @Column(name = "Type", length = 100, nullable = false)
    private String type;

    @Column(name = "Message", length = 500)
    private String message;

    @Column(name = "RequestDate", nullable = false)
    private LocalDate requestDate;

    @Column(name = "Status", length = 50, nullable = false)
    private String status;
}