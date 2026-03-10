// controller/LibraryController.java
package com.library.controller;

import com.library.model.Library;
import com.library.service.LibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/libraries")
@RequiredArgsConstructor
public class LibraryController {
    private final LibraryService service;

    @GetMapping
    public List<Library> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Library> getById(@PathVariable String id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Library create(@RequestBody Library entity) { return service.save(entity); }

    @PutMapping("/{id}")
    public ResponseEntity<Library> update(@PathVariable String id, @RequestBody Library entity) {
        if (service.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        entity.setLibraryId(id);
        return ResponseEntity.ok(service.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (service.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}