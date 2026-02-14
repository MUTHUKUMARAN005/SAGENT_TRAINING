package com.example.library.controller;

import com.example.library.model.Book;
import com.example.library.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController

@RequestMapping("/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService service;

    // ✅ GET ALL
    @GetMapping
    public ResponseEntity<List<Book>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    // ✅ GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Book> getById(@PathVariable String id){
        Book book = service.getById(id);
        return ResponseEntity.ok(book);
    }

    // ✅ POST CREATE
    @PostMapping
    public ResponseEntity<Book> create(@RequestBody Book obj){
        Book saved = service.save(obj);
        return ResponseEntity.ok(saved);
    }

    // ✅ PUT UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Book> update(@PathVariable String id,
                                       @RequestBody Book obj){
        obj.setBookID(id);
        Book updated = service.save(obj);
        return ResponseEntity.ok(updated);
    }

    // ✅ DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable String id){
        service.delete(id);
        return ResponseEntity.ok("Book deleted successfully");
    }
}
