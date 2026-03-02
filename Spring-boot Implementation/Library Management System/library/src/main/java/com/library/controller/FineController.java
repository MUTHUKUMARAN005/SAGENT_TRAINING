// controller/FineController.java
package com.library.controller;

import com.library.model.Fine;
import com.library.service.FineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fines")
@RequiredArgsConstructor
public class FineController {
    private final FineService service;

    @GetMapping
    public List<Fine> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Fine> getById(@PathVariable String id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Fine create(@RequestBody Fine entity) { return service.save(entity); }

    @PutMapping("/{id}")
    public ResponseEntity<Fine> update(@PathVariable String id, @RequestBody Fine entity) {
        if (service.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        entity.setFineId(id);
        return ResponseEntity.ok(service.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (service.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}