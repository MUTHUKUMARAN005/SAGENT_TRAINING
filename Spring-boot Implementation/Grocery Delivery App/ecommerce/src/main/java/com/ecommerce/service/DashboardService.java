package com.ecommerce.service;

import com.ecommerce.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class DashboardService {

    @Autowired private OrderRepository orderRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private StoreRepository storeRepository;
    @Autowired private DeliveryRepository deliveryRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private InventoryRepository inventoryRepository;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", orderRepository.count());
        stats.put("totalCustomers", customerRepository.count());
        stats.put("totalProducts", productRepository.count());
        stats.put("totalStores", storeRepository.count());
        stats.put("totalRevenue", orderRepository.getTotalRevenue());
        stats.put("pendingDeliveries", deliveryRepository.findByStatus(
                com.ecommerce.model.Delivery.DeliveryStatus.PENDING).size());
        stats.put("lowStockItems", inventoryRepository.findLowStockItems().size());
        stats.put("totalDeliveries", deliveryRepository.count());
        return stats;
    }
}