package com.example.library.service;

import com.example.library.model.Member;
import com.example.library.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository repo;

    public List<Member> getAll(){
        return repo.findAll();
    }

    public Member getById(String id){
        return repo.findById(id).orElseThrow();
    }

    public Member save(Member obj){
        return repo.save(obj);
    }

    public void delete(String id){
        repo.deleteById(id);
    }
}
