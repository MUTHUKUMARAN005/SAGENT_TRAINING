package com.ecommerce.service;

import com.ecommerce.model.Inventory;
import com.ecommerce.model.Product;
import com.ecommerce.repository.InventoryRepository;
import com.ecommerce.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ProductRepository productRepository;

    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    public Optional<Inventory> getInventoryById(Integer id) {
        return inventoryRepository.findById(id);
    }

    public Inventory getInventoryByProductId(Integer productId) {
        return inventoryRepository.findByProduct_ProductId(productId);
    }

    public List<Inventory> getLowStockItems() {
        return inventoryRepository.findLowStockItems();
    }

    public Inventory createInventory(Inventory inventory) {
        // Validate product exists
        if (inventory.getProduct() != null && inventory.getProduct().getProductId() != null) {
            Product product = productRepository.findById(inventory.getProduct().getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));
            inventory.setProduct(product);
        }

        // Check if inventory already exists for this product
        Inventory existing = inventoryRepository.findByProduct_ProductId(
                inventory.getProduct().getProductId());
        if (existing != null) {
            throw new RuntimeException("Inventory record already exists for this product");
        }

        inventory.setLastUpdated(LocalDateTime.now());
        return inventoryRepository.save(inventory);
    }

    public Inventory updateStock(Integer id, Integer newQuantity) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory not found with id: " + id));

        if (newQuantity < 0) {
            throw new RuntimeException("Stock quantity cannot be negative");
        }

        inventory.setStockQuantity(newQuantity);
        inventory.setLastUpdated(LocalDateTime.now());

        return inventoryRepository.save(inventory);
    }

    public Inventory updateInventory(Integer id, Inventory inventoryDetails) {
        Inventory inventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inventory not found with id: " + id));

        if (inventoryDetails.getStockQuantity() != null) {
            if (inventoryDetails.getStockQuantity() < 0) {
                throw new RuntimeException("Stock quantity cannot be negative");
            }
            inventory.setStockQuantity(inventoryDetails.getStockQuantity());
        }

        if (inventoryDetails.getReorderLevel() != null) {
            inventory.setReorderLevel(inventoryDetails.getReorderLevel());
        }

        inventory.setLastUpdated(LocalDateTime.now());
        return inventoryRepository.save(inventory);
    }

    public Inventory decreaseStock(Integer productId, int quantity) {
        Inventory inventory = inventoryRepository.findByProduct_ProductId(productId);
        if (inventory == null) {
            throw new RuntimeException("No inventory found for product: " + productId);
        }

        int currentStock = inventory.getStockQuantity();
        if (currentStock < quantity) {
            throw new RuntimeException("Insufficient stock. Available: " + currentStock
                    + ", Requested: " + quantity);
        }

        inventory.setStockQuantity(currentStock - quantity);
        inventory.setLastUpdated(LocalDateTime.now());

        return inventoryRepository.save(inventory);
    }

    public Inventory increaseStock(Integer productId, int quantity) {
        Inventory inventory = inventoryRepository.findByProduct_ProductId(productId);
        if (inventory == null) {
            throw new RuntimeException("No inventory found for product: " + productId);
        }

        inventory.setStockQuantity(inventory.getStockQuantity() + quantity);
        inventory.setLastUpdated(LocalDateTime.now());

        return inventoryRepository.save(inventory);
    }

    public boolean isLowStock(Integer inventoryId) {
        Inventory inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));
        return inventory.getStockQuantity() <= inventory.getReorderLevel();
    }

    public void deleteInventory(Integer id) {
        if (!inventoryRepository.existsById(id)) {
            throw new RuntimeException("Inventory not found with id: " + id);
        }
        inventoryRepository.deleteById(id);
    }
}