package com.ecommerce.controller;

import com.ecommerce.model.Inventory;
import com.ecommerce.repository.InventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired
    private InventoryRepository inventoryRepository;

    @GetMapping
    public List<Inventory> getAll() { return inventoryRepository.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Inventory> getById(@PathVariable Integer id) {
        return inventoryRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/low-stock")
    public List<Inventory> getLowStock() { return inventoryRepository.findLowStockItems(); }

    @PutMapping("/{id}")
    public ResponseEntity<Inventory> update(@PathVariable Integer id,
                                            @RequestBody Inventory details) {
        return inventoryRepository.findById(id).map(i -> {
            i.setStockQuantity(details.getStockQuantity());
            i.setReorderLevel(details.getReorderLevel());
            return ResponseEntity.ok(inventoryRepository.save(i));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Inventory create(@RequestBody Inventory inventory) {
        return inventoryRepository.save(inventory);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        inventoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}