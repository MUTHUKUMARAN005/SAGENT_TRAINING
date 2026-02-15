// service/RequestService.java
package com.library.service;

import com.library.model.Request;
import com.library.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RequestService {
    private final RequestRepository repository;

    public List<Request> findAll() { return repository.findAll(); }
    public Optional<Request> findById(String id) { return repository.findById(id); }
    public Request save(Request entity) { return repository.save(entity); }
    public void deleteById(String id) { repository.deleteById(id); }
    public long countPending() { return repository.countByStatus("Pending"); }
}