// model/BookCopy.java
package com.library.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "BookCopy")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class BookCopy {
    @Id
    @Column(name = "CopyID", length = 50)
    private String copyId;

    @ManyToOne
    @JoinColumn(name = "BookID", nullable = false)
    private Book book;

    @ManyToOne
    @JoinColumn(name = "LibraryID", nullable = false)
    private Library library;

    @Column(name = "Status", length = 50, nullable = false)
    private String status;

    @Column(name = "Location")
    private String location;
}