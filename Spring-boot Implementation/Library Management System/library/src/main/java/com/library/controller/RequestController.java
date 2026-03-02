// controller/RequestController.java
package com.library.controller;

import com.library.model.Request;
import com.library.service.RequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class RequestController {
    private final RequestService service;

    @GetMapping
    public List<Request> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Request> getById(@PathVariable String id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Request create(@RequestBody Request entity) { return service.save(entity); }

    @PutMapping("/{id}")
    public ResponseEntity<Request> update(@PathVariable String id, @RequestBody Request entity) {
        if (service.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        entity.setRequestId(id);
        return ResponseEntity.ok(service.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (service.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}