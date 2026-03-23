// src/main/java/com/daansetu/entity/NGO.java
package com.daansetu.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ngos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NGO {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ngoId;

    @Column(nullable = false)
    private String ngoName;

    @Column(columnDefinition = "TEXT")
    private String address;

    private String city;
    private String state;
    private String phone;

    @Column(unique = true)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String registrationNumber;
    private String panNumber;
    private String section80gNumber;
    private String logo;
    private String website;
    private Double latitude;
    private Double longitude;
    private boolean verified = false;

    @OneToMany(mappedBy = "ngo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Campaign> campaigns = new ArrayList<>();

    @OneToMany(mappedBy = "ngo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Volunteer> volunteers = new ArrayList<>();
}