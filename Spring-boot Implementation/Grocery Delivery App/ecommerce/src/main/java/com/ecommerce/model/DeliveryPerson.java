package com.ecommerce.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "delivery_person")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryPerson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "delivery_person_id")
    private Integer deliveryPersonId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 20)
    private String phone;

    @Column(name = "vehicle_type", length = 50)
    private String vehicleType;

    @Column(name = "current_location", length = 200)
    private String currentLocation;

    @Column(name = "availability_status")
    private Boolean availabilityStatus;
}