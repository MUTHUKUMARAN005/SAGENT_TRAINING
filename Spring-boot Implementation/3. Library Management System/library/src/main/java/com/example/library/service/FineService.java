package com.example.library.service;

import com.example.library.model.Fine;
import com.example.library.repository.FineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FineService {

    private final FineRepository repo;

    public List<Fine> getAll(){
        return repo.findAll();
    }

    public Fine getById(String id){
        return repo.findById(id).orElseThrow();
    }

    public Fine save(Fine obj){
        return repo.save(obj);
    }

    public void delete(String id){
        repo.deleteById(id);
    }
}
