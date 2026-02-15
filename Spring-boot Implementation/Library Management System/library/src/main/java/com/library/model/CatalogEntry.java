// model/CatalogEntry.java
package com.library.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "CatalogEntry")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CatalogEntry {
    @Id
    @Column(name = "EntryID", length = 50)
    private String entryId;

    @ManyToOne
    @JoinColumn(name = "BookID", nullable = false)
    private Book book;

    @ManyToOne
    @JoinColumn(name = "LibraryID", nullable = false)
    private Library library;

    @Column(name = "DateAdded", nullable = false)
    private LocalDate dateAdded;

    @Column(name = "LastUpdated")
    private LocalDate lastUpdated;
}