package com.example.budgettracker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
@Table(name = "Category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Integer categoryId;

    @Column(name = "category_name", length = 100)
    private String categoryName;

    @Column(name = "category_type", length = 50)
    private String categoryType;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "is_custom")
    private Boolean isCustom;
}