package com.example.library.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "BookCopy")
@Data
public class BookCopy {

    @Id
    @Column(name = "CopyID")
    private String copyID;

    @Column(name = "BookID")
    private String bookID;

    @Column(name = "LibraryID")
    private String libraryID;

    @Column(name = "Status")
    private String status;

    @Column(name = "Location")
    private String location;
}

