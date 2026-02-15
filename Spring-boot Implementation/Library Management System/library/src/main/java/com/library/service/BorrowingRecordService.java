// service/BorrowingRecordService.java
package com.library.service;

import com.library.model.BorrowingRecord;
import com.library.repository.BorrowingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BorrowingRecordService {
    private final BorrowingRecordRepository repository;

    public List<BorrowingRecord> findAll() { return repository.findAll(); }
    public Optional<BorrowingRecord> findById(String id) { return repository.findById(id); }
    public BorrowingRecord save(BorrowingRecord entity) { return repository.save(entity); }
    public void deleteById(String id) { repository.deleteById(id); }
    public long countActive() { return repository.countByStatus("Active"); }
    public long countOverdue() { return repository.countByStatus("Overdue"); }
}