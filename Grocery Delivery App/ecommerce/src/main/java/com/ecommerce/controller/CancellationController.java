package com.ecommerce.controller;

import com.ecommerce.model.Cancellation;
import com.ecommerce.repository.CancellationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/cancellations")
public class CancellationController {

    @Autowired
    private CancellationRepository cancellationRepository;

    @GetMapping
    public List<Cancellation> getAll() { return cancellationRepository.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Cancellation> getById(@PathVariable Integer id) {
        return cancellationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Cancellation create(@RequestBody Cancellation cancellation) {
        return cancellationRepository.save(cancellation);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        cancellationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}