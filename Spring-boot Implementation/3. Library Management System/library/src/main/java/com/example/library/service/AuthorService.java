package com.example.library.service;

import com.example.library.model.Author;
import com.example.library.repository.AuthorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthorService {

    private final AuthorRepository repo;

    public List<Author> getAll(){
        return repo.findAll();
    }

    public Author getById(String id){
        return repo.findById(id).orElseThrow();
    }

    public Author save(Author obj){
        return repo.save(obj);
    }

    public void delete(String id){
        repo.deleteById(id);
    }
}
