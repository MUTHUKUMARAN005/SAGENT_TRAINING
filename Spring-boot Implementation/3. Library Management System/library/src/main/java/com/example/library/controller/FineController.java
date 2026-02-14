package com.example.library.controller;

import com.example.library.model.Fine;
import com.example.library.service.FineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/fines")
@RequiredArgsConstructor
public class FineController {

    private final FineService service;

    // ✅ GET ALL FINES
    @GetMapping
    public ResponseEntity<List<Fine>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    // ✅ GET FINE BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Fine> getById(@PathVariable String id){
        return ResponseEntity.ok(service.getById(id));
    }

    // ✅ CREATE FINE
    @PostMapping
    public ResponseEntity<Fine> create(@RequestBody Fine obj){
        return ResponseEntity.ok(service.save(obj));
    }

    // ✅ UPDATE FINE
    @PutMapping("/{id}")
    public ResponseEntity<Fine> update(@PathVariable String id,
                                       @RequestBody Fine obj){
        obj.setFineID(id);
        return ResponseEntity.ok(service.save(obj));
    }

    // ✅ DELETE FINE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable String id){
        service.delete(id);
        return ResponseEntity.ok("Fine deleted successfully");
    }
}
