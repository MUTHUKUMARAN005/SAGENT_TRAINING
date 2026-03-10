// service/CatalogEntryService.java
package com.library.service;

import com.library.model.CatalogEntry;
import com.library.repository.CatalogEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CatalogEntryService {
    private final CatalogEntryRepository repository;

    public List<CatalogEntry> findAll() { return repository.findAll(); }
    public Optional<CatalogEntry> findById(String id) { return repository.findById(id); }
    public CatalogEntry save(CatalogEntry entity) { return repository.save(entity); }
    public void deleteById(String id) { repository.deleteById(id); }
}