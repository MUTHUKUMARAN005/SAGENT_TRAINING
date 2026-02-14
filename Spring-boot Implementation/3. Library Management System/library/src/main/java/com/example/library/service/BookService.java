package com.example.library.service;

import com.example.library.model.Book;
import com.example.library.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository repo;

    public List<Book> getAll(){
        return repo.findAll();
    }

    public Book getById(String id){
        return repo.findById(id).orElseThrow();
    }

    public Book save(Book obj){
        return repo.save(obj);
    }

    public void delete(String id){
        repo.deleteById(id);
    }
}
