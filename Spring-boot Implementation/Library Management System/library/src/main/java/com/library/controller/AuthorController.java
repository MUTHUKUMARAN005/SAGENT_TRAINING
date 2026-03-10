// controller/AuthorController.java
package com.library.controller;

import com.library.model.Author;
import com.library.service.AuthorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/authors")
@RequiredArgsConstructor
public class AuthorController {
    private final AuthorService service;

    @GetMapping
    public List<Author> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Author> getById(@PathVariable String id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Author create(@RequestBody Author entity) { return service.save(entity); }

    @PutMapping("/{id}")
    public ResponseEntity<Author> update(@PathVariable String id, @RequestBody Author entity) {
        if (service.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        entity.setAuthorId(id);
        return ResponseEntity.ok(service.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (service.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}