package com.ecommerce.repository;

import com.ecommerce.model.DeliveryPerson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeliveryPersonRepository extends JpaRepository<DeliveryPerson, Integer> {
    List<DeliveryPerson> findByAvailabilityStatusTrue();
}