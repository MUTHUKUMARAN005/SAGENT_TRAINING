package com.example.library.controller;

import com.example.library.model.BookCopy;
import com.example.library.service.BookCopyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/copies")
@RequiredArgsConstructor
public class BookCopyController {

    private final BookCopyService service;

    // ✅ GET ALL
    @GetMapping
    public ResponseEntity<List<BookCopy>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    // ✅ GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<BookCopy> getById(@PathVariable String id){
        BookCopy copy = service.getById(id);
        return ResponseEntity.ok(copy);
    }

    // ✅ POST CREATE
    @PostMapping
    public ResponseEntity<BookCopy> create(@RequestBody BookCopy obj){
        BookCopy saved = service.save(obj);
        return ResponseEntity.ok(saved);
    }

    // ✅ PUT UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<BookCopy> update(@PathVariable String id,
                                           @RequestBody BookCopy obj){
        obj.setCopyID(id);
        BookCopy updated = service.save(obj);
        return ResponseEntity.ok(updated);
    }

    // ✅ DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable String id){
        service.delete(id);
        return ResponseEntity.ok("Book copy deleted successfully");
    }
}
