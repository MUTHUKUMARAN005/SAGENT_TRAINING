// model/Book.java
package com.library.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Book")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Book {
    @Id
    @Column(name = "BookID", length = 50)
    private String bookId;

    @Column(name = "ISBN", length = 20, nullable = false)
    private String isbn;

    @Column(name = "Title", nullable = false)
    private String title;

    @Column(name = "Author", nullable = false)
    private String author;

    @Column(name = "Subject")
    private String subject;

    @Column(name = "PublicationYear")
    private Integer publicationYear;
}