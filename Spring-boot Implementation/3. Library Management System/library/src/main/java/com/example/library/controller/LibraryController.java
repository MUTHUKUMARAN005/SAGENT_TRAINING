package com.example.library.controller;

import com.example.library.model.Library;
import com.example.library.service.LibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/libraries")
@RequiredArgsConstructor
public class LibraryController {

    private final LibraryService service;

    // ✅ GET ALL
    @GetMapping
    public ResponseEntity<List<Library>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    // ✅ GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Library> getById(@PathVariable String id){
        Library library = service.getById(id);
        return ResponseEntity.ok(library);
    }

    // ✅ POST CREATE
    @PostMapping
    public ResponseEntity<Library> create(@RequestBody Library obj){
        Library saved = service.save(obj);
        return ResponseEntity.ok(saved);
    }

    // ✅ PUT UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Library> update(@PathVariable String id,
                                          @RequestBody Library obj){
        obj.setLibraryID(id);
        Library updated = service.save(obj);
        return ResponseEntity.ok(updated);
    }

    // ✅ DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable String id){
        service.delete(id);
        return ResponseEntity.ok("Library deleted successfully");
    }
}
