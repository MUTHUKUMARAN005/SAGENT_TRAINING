package com.example.library.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class Member {

    @Id
    private String memberID;

    private String name;
    private String email;
    private String phone;

    private LocalDate membershipDate;
    private String status;
}
