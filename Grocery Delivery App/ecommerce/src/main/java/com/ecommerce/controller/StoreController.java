package com.ecommerce.controller;

import com.ecommerce.model.Store;
import com.ecommerce.repository.StoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/stores")
public class StoreController {

    @Autowired
    private StoreRepository storeRepository;

    @GetMapping
    public List<Store> getAll() { return storeRepository.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Store> getById(@PathVariable Integer id) {
        return storeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Store create(@RequestBody Store store) { return storeRepository.save(store); }

    @PutMapping("/{id}")
    public ResponseEntity<Store> update(@PathVariable Integer id, @RequestBody Store details) {
        return storeRepository.findById(id).map(s -> {
            s.setStoreName(details.getStoreName());
            s.setStoreAddress(details.getStoreAddress());
            s.setContactNumber(details.getContactNumber());
            s.setStoreManager(details.getStoreManager());
            return ResponseEntity.ok(storeRepository.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        storeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}