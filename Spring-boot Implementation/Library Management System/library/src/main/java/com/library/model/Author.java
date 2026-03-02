// model/Author.java
package com.library.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Author")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Author {
    @Id
    @Column(name = "AuthorID", length = 50)
    private String authorId;

    @Column(name = "Name", nullable = false)
    private String name;

    @Column(name = "Biography", columnDefinition = "TEXT")
    private String biography;
}