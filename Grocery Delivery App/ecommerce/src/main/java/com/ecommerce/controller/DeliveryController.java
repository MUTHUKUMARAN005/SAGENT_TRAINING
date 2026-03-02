package com.ecommerce.controller;

import com.ecommerce.model.Delivery;
import com.ecommerce.model.DeliveryPerson;
import com.ecommerce.repository.DeliveryRepository;
import com.ecommerce.repository.DeliveryPersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    @Autowired private DeliveryRepository deliveryRepository;
    @Autowired private DeliveryPersonRepository deliveryPersonRepository;

    @GetMapping
    public List<Delivery> getAll() { return deliveryRepository.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Delivery> getById(@PathVariable Integer id) {
        return deliveryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Delivery create(@RequestBody Delivery delivery) {
        return deliveryRepository.save(delivery);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Delivery> updateStatus(@PathVariable Integer id,
                                                 @RequestParam Delivery.DeliveryStatus status) {
        return deliveryRepository.findById(id).map(d -> {
            d.setStatus(status);
            return ResponseEntity.ok(deliveryRepository.save(d));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/persons")
    public List<DeliveryPerson> getAllPersons() { return deliveryPersonRepository.findAll(); }

    @GetMapping("/persons/available")
    public List<DeliveryPerson> getAvailablePersons() {
        return deliveryPersonRepository.findByAvailabilityStatusTrue();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        deliveryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}