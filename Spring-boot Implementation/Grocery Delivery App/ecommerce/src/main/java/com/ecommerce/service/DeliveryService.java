package com.ecommerce.service;

import com.ecommerce.model.Delivery;
import com.ecommerce.model.DeliveryPerson;
import com.ecommerce.model.Order;
import com.ecommerce.repository.DeliveryRepository;
import com.ecommerce.repository.DeliveryPersonRepository;
import com.ecommerce.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class DeliveryService {

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private DeliveryPersonRepository deliveryPersonRepository;

    @Autowired
    private OrderRepository orderRepository;

    // ========== DELIVERY OPERATIONS ==========

    public List<Delivery> getAllDeliveries() {
        return deliveryRepository.findAll();
    }

    public Optional<Delivery> getDeliveryById(Integer id) {
        return deliveryRepository.findById(id);
    }

    public Delivery getDeliveryByOrderId(Integer orderId) {
        return deliveryRepository.findByOrder_OrderId(orderId);
    }

    public List<Delivery> getDeliveriesByStatus(Delivery.DeliveryStatus status) {
        return deliveryRepository.findByStatus(status);
    }

    public Delivery createDelivery(Delivery delivery) {
        // Validate order exists
        if (delivery.getOrder() != null && delivery.getOrder().getOrderId() != null) {
            Order order = orderRepository.findById(delivery.getOrder().getOrderId())
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            delivery.setOrder(order);

            // Check if delivery already exists for this order
            Delivery existing = deliveryRepository.findByOrder_OrderId(order.getOrderId());
            if (existing != null) {
                throw new RuntimeException("Delivery already exists for Order #" + order.getOrderId());
            }
        }

        // Validate and assign delivery person
        if (delivery.getDeliveryPerson() != null &&
                delivery.getDeliveryPerson().getDeliveryPersonId() != null) {
            DeliveryPerson person = deliveryPersonRepository
                    .findById(delivery.getDeliveryPerson().getDeliveryPersonId())
                    .orElseThrow(() -> new RuntimeException("Delivery person not found"));

            if (!person.getAvailabilityStatus()) {
                throw new RuntimeException("Delivery person " + person.getName() + " is not available");
            }

            delivery.setDeliveryPerson(person);
            // Mark delivery person as unavailable
            person.setAvailabilityStatus(false);
            deliveryPersonRepository.save(person);
        }

        if (delivery.getStatus() == null) {
            delivery.setStatus(Delivery.DeliveryStatus.PENDING);
        }

        return deliveryRepository.save(delivery);
    }

    public Delivery updateDeliveryStatus(Integer id, Delivery.DeliveryStatus status) {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery not found with id: " + id));

        delivery.setStatus(status);

        // If delivered, set actual delivery time and free up delivery person
        if (status == Delivery.DeliveryStatus.DELIVERED) {
            delivery.setActualDeliveryTime(LocalDateTime.now());

            // Update order status
            if (delivery.getOrder() != null) {
                Order order = delivery.getOrder();
                order.setStatus(Order.OrderStatus.DELIVERED);
                orderRepository.save(order);
            }

            // Mark delivery person as available again
            if (delivery.getDeliveryPerson() != null) {
                DeliveryPerson person = delivery.getDeliveryPerson();
                person.setAvailabilityStatus(true);
                deliveryPersonRepository.save(person);
            }
        }

        // If failed, free up delivery person
        if (status == Delivery.DeliveryStatus.FAILED) {
            if (delivery.getDeliveryPerson() != null) {
                DeliveryPerson person = delivery.getDeliveryPerson();
                person.setAvailabilityStatus(true);
                deliveryPersonRepository.save(person);
            }
        }

        return deliveryRepository.save(delivery);
    }

    public Delivery assignDeliveryPerson(Integer deliveryId, Integer deliveryPersonId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Delivery not found"));

        DeliveryPerson person = deliveryPersonRepository.findById(deliveryPersonId)
                .orElseThrow(() -> new RuntimeException("Delivery person not found"));

        if (!person.getAvailabilityStatus()) {
            throw new RuntimeException("Delivery person is not available");
        }

        // Free previous delivery person if exists
        if (delivery.getDeliveryPerson() != null) {
            DeliveryPerson previousPerson = delivery.getDeliveryPerson();
            previousPerson.setAvailabilityStatus(true);
            deliveryPersonRepository.save(previousPerson);
        }

        delivery.setDeliveryPerson(person);
        person.setAvailabilityStatus(false);
        deliveryPersonRepository.save(person);

        return deliveryRepository.save(delivery);
    }

    public void deleteDelivery(Integer id) {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery not found with id: " + id));

        // Free up delivery person
        if (delivery.getDeliveryPerson() != null) {
            DeliveryPerson person = delivery.getDeliveryPerson();
            person.setAvailabilityStatus(true);
            deliveryPersonRepository.save(person);
        }

        deliveryRepository.deleteById(id);
    }

    // ========== DELIVERY PERSON OPERATIONS ==========

    public List<DeliveryPerson> getAllDeliveryPersons() {
        return deliveryPersonRepository.findAll();
    }

    public Optional<DeliveryPerson> getDeliveryPersonById(Integer id) {
        return deliveryPersonRepository.findById(id);
    }

    public List<DeliveryPerson> getAvailableDeliveryPersons() {
        return deliveryPersonRepository.findByAvailabilityStatusTrue();
    }

    public DeliveryPerson createDeliveryPerson(DeliveryPerson person) {
        if (person.getAvailabilityStatus() == null) {
            person.setAvailabilityStatus(true);
        }
        return deliveryPersonRepository.save(person);
    }

    public DeliveryPerson updateDeliveryPerson(Integer id, DeliveryPerson personDetails) {
        DeliveryPerson person = deliveryPersonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery person not found with id: " + id));

        person.setName(personDetails.getName());
        person.setPhone(personDetails.getPhone());
        person.setVehicleType(personDetails.getVehicleType());
        person.setCurrentLocation(personDetails.getCurrentLocation());
        person.setAvailabilityStatus(personDetails.getAvailabilityStatus());

        return deliveryPersonRepository.save(person);
    }

    public DeliveryPerson updateLocation(Integer id, String location) {
        DeliveryPerson person = deliveryPersonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery person not found"));

        person.setCurrentLocation(location);
        return deliveryPersonRepository.save(person);
    }

    public void deleteDeliveryPerson(Integer id) {
        if (!deliveryPersonRepository.existsById(id)) {
            throw new RuntimeException("Delivery person not found with id: " + id);
        }
        deliveryPersonRepository.deleteById(id);
    }
}