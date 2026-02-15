// service/MemberService.java
package com.library.service;

import com.library.model.Member;
import com.library.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MemberService {
    private final MemberRepository repository;

    public List<Member> findAll() { return repository.findAll(); }
    public Optional<Member> findById(String id) { return repository.findById(id); }
    public Member save(Member entity) { return repository.save(entity); }
    public void deleteById(String id) { repository.deleteById(id); }
    public long count() { return repository.count(); }
    public long countActive() { return repository.countByStatus("Active"); }
}