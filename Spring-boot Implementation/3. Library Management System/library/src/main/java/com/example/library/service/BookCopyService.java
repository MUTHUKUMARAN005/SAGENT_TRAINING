package com.example.library.service;

import com.example.library.model.BookCopy;
import com.example.library.repository.BookCopyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookCopyService {

    private final BookCopyRepository repo;

    public List<BookCopy> getAll(){
        return repo.findAll();
    }

    public BookCopy getById(String id){
        return repo.findById(id).orElseThrow();
    }

    public BookCopy save(BookCopy obj){
        return repo.save(obj);
    }

    public void delete(String id){
        repo.deleteById(id);
    }
}
