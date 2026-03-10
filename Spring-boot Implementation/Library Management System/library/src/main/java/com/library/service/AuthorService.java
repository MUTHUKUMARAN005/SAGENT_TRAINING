// service/AuthorService.java
package com.library.service;

import com.library.model.Author;
import com.library.repository.AuthorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthorService {
    private final AuthorRepository repository;

    public List<Author> findAll() { return repository.findAll(); }
    public Optional<Author> findById(String id) { return repository.findById(id); }
    public Author save(Author entity) { return repository.save(entity); }
    public void deleteById(String id) { repository.deleteById(id); }
}