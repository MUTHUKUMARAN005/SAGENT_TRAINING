package com.college.admission.controller;

import com.college.admission.model.Login;
import com.college.admission.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/logins")
public class LoginController {

    @Autowired
    private LoginService loginService;

    @GetMapping
    public List<Login> getAllLogins() {
        return loginService.getAllLogins();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Login> getLoginById(@PathVariable Integer id) {
        return loginService.getLoginById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<Login> getLoginByUsername(@PathVariable String username) {
        return loginService.getLoginByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Login createLogin(@RequestBody Login login) {
        return loginService.createLogin(login);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Login> updateLogin(@PathVariable Integer id,
                                             @RequestBody Login login) {
        return ResponseEntity.ok(loginService.updateLogin(id, login));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLogin(@PathVariable Integer id) {
        loginService.deleteLogin(id);
        return ResponseEntity.noContent().build();
    }
}