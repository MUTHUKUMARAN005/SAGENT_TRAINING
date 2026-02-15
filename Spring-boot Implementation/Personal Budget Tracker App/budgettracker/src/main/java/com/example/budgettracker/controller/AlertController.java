package com.example.budgettracker.controller;

import com.example.budgettracker.model.Alert;
import com.example.budgettracker.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private AlertService alertService;

    @GetMapping
    public List<Alert> getAll() {
        return alertService.getAllAlerts();
    }

    @GetMapping("/user/{userId}")
    public List<Alert> getByUser(@PathVariable Integer userId) {
        return alertService.getAlertsByUserId(userId);
    }

    @GetMapping("/user/{userId}/unread")
    public List<Alert> getUnread(@PathVariable Integer userId) {
        return alertService.getUnreadAlerts(userId);
    }

    @GetMapping("/user/{userId}/unread/count")
    public long getUnreadCount(@PathVariable Integer userId) {
        return alertService.getUnreadCount(userId);
    }

    @PostMapping
    public Alert create(@RequestBody Alert alert) {
        return alertService.createAlert(alert);
    }

    @PatchMapping("/{id}/read")
    public Alert markRead(@PathVariable Integer id) {
        return alertService.markAsRead(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        alertService.deleteAlert(id);
        return ResponseEntity.noContent().build();
    }
}