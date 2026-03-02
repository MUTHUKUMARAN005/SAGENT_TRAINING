// model/Library.java
package com.library.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Library")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Library {
    @Id
    @Column(name = "LibraryID", length = 50)
    private String libraryId;

    @Column(name = "Name", nullable = false)
    private String name;

    @Column(name = "Location", nullable = false)
    private String location;

    @Column(name = "ContactEmail", nullable = false)
    private String contactEmail;
}