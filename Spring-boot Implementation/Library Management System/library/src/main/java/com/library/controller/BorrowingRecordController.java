// controller/BorrowingRecordController.java
package com.library.controller;

import com.library.model.BorrowingRecord;
import com.library.service.BorrowingRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/borrowing-records")
@RequiredArgsConstructor
public class BorrowingRecordController {
    private final BorrowingRecordService service;

    @GetMapping
    public List<BorrowingRecord> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<BorrowingRecord> getById(@PathVariable String id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public BorrowingRecord create(@RequestBody BorrowingRecord entity) { return service.save(entity); }

    @PutMapping("/{id}")
    public ResponseEntity<BorrowingRecord> update(@PathVariable String id, @RequestBody BorrowingRecord entity) {
        if (service.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        entity.setRecordId(id);
        return ResponseEntity.ok(service.save(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (service.findById(id).isEmpty()) return ResponseEntity.notFound().build();
        service.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}