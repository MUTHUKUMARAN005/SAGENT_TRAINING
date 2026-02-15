// service/LibraryService.java
package com.library.service;

import com.library.model.Library;
import com.library.repository.LibraryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LibraryService {
    private final LibraryRepository repository;

    public List<Library> findAll() { return repository.findAll(); }
    public Optional<Library> findById(String id) { return repository.findById(id); }
    public Library save(Library entity) { return repository.save(entity); }
    public void deleteById(String id) { repository.deleteById(id); }
    public long count() { return repository.count(); }
}