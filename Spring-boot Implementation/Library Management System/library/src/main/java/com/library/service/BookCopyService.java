// service/BookCopyService.java
package com.library.service;

import com.library.model.BookCopy;
import com.library.repository.BookCopyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BookCopyService {
    private final BookCopyRepository repository;

    public List<BookCopy> findAll() { return repository.findAll(); }
    public Optional<BookCopy> findById(String id) { return repository.findById(id); }
    public BookCopy save(BookCopy entity) { return repository.save(entity); }
    public void deleteById(String id) { repository.deleteById(id); }
    public long countAvailable() { return repository.countByStatus("Available"); }
}