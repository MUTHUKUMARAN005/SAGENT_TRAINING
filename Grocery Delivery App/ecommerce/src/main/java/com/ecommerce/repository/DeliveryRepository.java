package com.ecommerce.repository;

import com.ecommerce.model.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Integer> {
    Delivery findByOrder_OrderId(Integer orderId);
    List<Delivery> findByStatus(Delivery.DeliveryStatus status);
}