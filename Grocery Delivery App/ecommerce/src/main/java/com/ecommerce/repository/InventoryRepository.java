package com.ecommerce.repository;

import com.ecommerce.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Integer> {
    Inventory findByProduct_ProductId(Integer productId);

    @Query("SELECT i FROM Inventory i WHERE i.stockQuantity <= i.reorderLevel")
    List<Inventory> findLowStockItems();
}