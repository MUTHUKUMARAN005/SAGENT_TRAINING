package com.example.library.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Library {

    @Id
    private String libraryID;

    private String name;
    private String location;
    private String contactEmail;
}
