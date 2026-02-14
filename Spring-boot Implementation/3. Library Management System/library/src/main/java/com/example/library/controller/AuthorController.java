package com.example.library.controller;

import com.example.library.model.Author;
import com.example.library.service.AuthorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController

@RequestMapping("/authors")
@RequiredArgsConstructor
public class AuthorController {

    private final AuthorService service;

    // ✅ GET ALL
    @GetMapping
    public ResponseEntity<List<Author>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    // ✅ GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Author> getById(@PathVariable String id){
        Author author = service.getById(id);
        return ResponseEntity.ok(author);
    }

    // ✅ POST CREATE
    @PostMapping
    public ResponseEntity<Author> create(@RequestBody Author obj){
        Author saved = service.save(obj);
        return ResponseEntity.ok(saved);
    }

    // ✅ PUT UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Author> update(@PathVariable String id,
                                         @RequestBody Author obj){
        obj.setAuthorID(id);
        Author updated = service.save(obj);
        return ResponseEntity.ok(updated);
    }

    // ✅ DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable String id){
        service.delete(id);
        return ResponseEntity.ok("Author deleted successfully");
    }
}
