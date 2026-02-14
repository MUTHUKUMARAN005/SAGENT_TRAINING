package com.example.library.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Author {

    @Id
    private String authorID;
    private String name;

    @Column(length = 2000)
    private String biography;
}
