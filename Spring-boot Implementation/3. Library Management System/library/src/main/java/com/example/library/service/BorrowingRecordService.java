package com.example.library.service;

import com.example.library.model.BorrowingRecord;
import com.example.library.repository.BorrowingRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BorrowingRecordService {

    private final BorrowingRecordRepository repo;

    public List<BorrowingRecord> getAll(){
        return repo.findAll();
    }

    public BorrowingRecord getById(String id){
        return repo.findById(id).orElseThrow();
    }

    public BorrowingRecord save(BorrowingRecord obj){
        return repo.save(obj);
    }

    public void delete(String id){
        repo.deleteById(id);
    }
}
