// service/BookService.java
package com.library.service;

import com.library.model.Book;
import com.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BookService {
    private final BookRepository repository;

    public List<Book> findAll() { return repository.findAll(); }
    public Optional<Book> findById(String id) { return repository.findById(id); }
    public Book save(Book entity) { return repository.save(entity); }
    public void deleteById(String id) { repository.deleteById(id); }
    public List<Book> searchByTitle(String title) { return repository.findByTitleContainingIgnoreCase(title); }
    public long count() { return repository.count(); }
}