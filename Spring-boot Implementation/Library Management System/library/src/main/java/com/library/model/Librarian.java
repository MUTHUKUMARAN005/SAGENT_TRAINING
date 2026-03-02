// model/Librarian.java
package com.library.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Librarian")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Librarian {
    @Id
    @Column(name = "LibrarianID", length = 50)
    private String librarianId;

    @Column(name = "Name", nullable = false)
    private String name;

    @Column(name = "Email", nullable = false)
    private String email;

    @Column(name = "Password", nullable = false)
    private String password;

    @Column(name = "Role", length = 100)
    private String role;

    @ManyToOne
    @JoinColumn(name = "LibraryID")
    private Library library;
}