package com.example.library.controller;

import com.example.library.model.Member;
import com.example.library.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService service;

    // ✅ GET ALL
    @GetMapping
    public ResponseEntity<List<Member>> getAll(){
        return ResponseEntity.ok(service.getAll());
    }

    // ✅ GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Member> getById(@PathVariable String id){
        Member member = service.getById(id);
        return ResponseEntity.ok(member);
    }

    // ✅ POST CREATE
    @PostMapping
    public ResponseEntity<Member> create(@RequestBody Member obj){
        Member saved = service.save(obj);
        return ResponseEntity.ok(saved);
    }

    // ✅ PUT UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Member> update(@PathVariable String id,
                                         @RequestBody Member obj){
        obj.setMemberID(id);
        Member updated = service.save(obj);
        return ResponseEntity.ok(updated);
    }

    // ✅ DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable String id){
        service.delete(id);
        return ResponseEntity.ok("Member deleted successfully");
    }
}
