// controller/LibrarianController.java
package com.library.controller;

import com.library.model.Librarian;
import com.library.service.LibrarianService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/librarians")
@RequiredArgsConstructor
public class LibrarianController {
    private final LibrarianService service;

    @GetMapping
    public List<Librarian> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Librarian> getById(@PathVariable String id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Librarian create(@RequestBody Librarian entity) { return service.save(entity); }

    @PutMapping("/{id}")
    public ResponseEntity<Librarian> update(@PathVariable String id, @RequestBody Librarian entity) {
        if (service.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        entity.setLibrarianId(id);
        return ResponseEntity.ok(service.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (service.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}