// service/LibrarianService.java
package com.library.service;

import com.library.model.Librarian;
import com.library.repository.LibrarianRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LibrarianService {
    private final LibrarianRepository repository;

    public List<Librarian> findAll() { return repository.findAll(); }
    public Optional<Librarian> findById(String id) { return repository.findById(id); }
    public Librarian save(Librarian entity) { return repository.save(entity); }
    public void deleteById(String id) { repository.deleteById(id); }
}