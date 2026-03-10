// service/FineService.java
package com.library.service;

import com.library.model.Fine;
import com.library.repository.FineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FineService {
    private final FineRepository repository;

    public List<Fine> findAll() { return repository.findAll(); }
    public Optional<Fine> findById(String id) { return repository.findById(id); }
    public Fine save(Fine entity) { return repository.save(entity); }
    public void deleteById(String id) { repository.deleteById(id); }
    public long countUnpaid() { return repository.countByStatus("Unpaid"); }
    public BigDecimal totalUnpaid() { return repository.totalUnpaidFines(); }
}