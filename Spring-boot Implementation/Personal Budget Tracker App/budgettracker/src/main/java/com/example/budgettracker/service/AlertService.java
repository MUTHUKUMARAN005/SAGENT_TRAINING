package com.example.budgettracker.service;

import com.example.budgettracker.model.Alert;
import com.example.budgettracker.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class AlertService {

    @Autowired
    private AlertRepository alertRepository;

    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }

    public List<Alert> getAlertsByUserId(Integer userId) {
        return alertRepository.findByUserUserId(userId);
    }

    public List<Alert> getUnreadAlerts(Integer userId) {
        return alertRepository.findByUserUserIdAndIsRead(userId, false);
    }

    public long getUnreadCount(Integer userId) {
        return alertRepository.countByUserUserIdAndIsRead(userId, false);
    }

    public Alert createAlert(Alert alert) {
        return alertRepository.save(alert);
    }

    public Alert markAsRead(Integer id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Alert not found with ID: " + id
                ));

        alert.setIsRead(true);
        return alertRepository.save(alert);
    }

    public void deleteAlert(Integer id) {
        if (!alertRepository.existsById(id)) {
            throw new RuntimeException("Alert not found with ID: " + id);
        }
        alertRepository.deleteById(id);
    }
}