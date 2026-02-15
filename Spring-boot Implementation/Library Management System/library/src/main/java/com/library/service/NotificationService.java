// service/NotificationService.java
package com.library.service;

import com.library.model.Notification;
import com.library.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository repository;

    public List<Notification> findAll() { return repository.findAll(); }
    public Optional<Notification> findById(String id) { return repository.findById(id); }
    public Notification save(Notification entity) { return repository.save(entity); }
    public void deleteById(String id) { repository.deleteById(id); }
}