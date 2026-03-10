package com.example.budgettracker.controller;

import com.example.budgettracker.model.Transfer;
import com.example.budgettracker.service.TransferService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transfers")
public class TransferController {

    @Autowired
    private TransferService transferService;

    @GetMapping
    public List<Transfer> getAll() {
        return transferService.getAllTransfers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transfer> getById(@PathVariable Integer id) {
        return transferService.getTransferById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<Transfer> getByUser(@PathVariable Integer userId) {
        return transferService.getTransfersByUserId(userId);
    }

    @PostMapping
    public Transfer create(@RequestBody Transfer transfer) {
        return transferService.createTransfer(transfer);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        transferService.deleteTransfer(id);
        return ResponseEntity.noContent().build();
    }
}
