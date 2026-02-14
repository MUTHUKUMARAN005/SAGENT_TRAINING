package com.example.library.service;

import com.example.library.model.Library;
import com.example.library.repository.LibraryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LibraryService {

    private final LibraryRepository repo;

    public List<Library> getAll(){
        return repo.findAll();
    }

    public Library getById(String id){
        return repo.findById(id).orElseThrow();
    }

    public Library save(Library obj){
        return repo.save(obj);
    }

    public void delete(String id){
        repo.deleteById(id);
    }
}
