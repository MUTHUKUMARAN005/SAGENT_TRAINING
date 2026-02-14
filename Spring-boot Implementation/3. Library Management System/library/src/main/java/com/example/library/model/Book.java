package com.example.library.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Book {

    @Id
    private String bookID;

    private String isbn;
    private String title;
    private String author;
    private String subject;
    private int publicationYear;
}
