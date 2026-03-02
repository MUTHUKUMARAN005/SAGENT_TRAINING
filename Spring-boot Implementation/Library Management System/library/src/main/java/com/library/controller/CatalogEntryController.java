// controller/CatalogEntryController.java
package com.library.controller;

import com.library.model.CatalogEntry;
import com.library.service.CatalogEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog-entries")
@RequiredArgsConstructor
public class CatalogEntryController {
    private final CatalogEntryService service;

    @GetMapping
    public List<CatalogEntry> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<CatalogEntry> getById(@PathVariable String id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public CatalogEntry create(@RequestBody CatalogEntry entity) { return service.save(entity); }

    @PutMapping("/{id}")
    public ResponseEntity<CatalogEntry> update(@PathVariable String id, @RequestBody CatalogEntry entity) {
        if (service.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        entity.setEntryId(id);
        return ResponseEntity.ok(service.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (service.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}