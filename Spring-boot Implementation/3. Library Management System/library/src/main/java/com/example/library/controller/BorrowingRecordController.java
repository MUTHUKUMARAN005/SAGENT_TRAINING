package com.example.library.controller;

import com.example.library.model.BorrowingRecord;
import com.example.library.service.BorrowingRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/records")
@RequiredArgsConstructor
public class BorrowingRecordController {

    private final BorrowingRecordService service;

    // ✅ GET ALL
    @GetMapping
    public ResponseEntity<List<BorrowingRecord>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    // ✅ GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<BorrowingRecord> getById(@PathVariable String id){
        BorrowingRecord record = service.getById(id);
        return ResponseEntity.ok(record);
    }

    // ✅ POST CREATE
    @PostMapping
    public ResponseEntity<BorrowingRecord> create(@RequestBody BorrowingRecord obj){
        BorrowingRecord saved = service.save(obj);
        return ResponseEntity.ok(saved);
    }

    // ✅ PUT UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<BorrowingRecord> update(@PathVariable String id,
                                                  @org.jetbrains.annotations.NotNull @RequestBody BorrowingRecord obj){
        obj.setRecordID(id);
        BorrowingRecord updated = service.save(obj);
        return ResponseEntity.ok(updated);
    }

    // ✅ DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable String id){
        service.delete(id);
        return ResponseEntity.ok("Borrowing record deleted successfully");
    }
}
