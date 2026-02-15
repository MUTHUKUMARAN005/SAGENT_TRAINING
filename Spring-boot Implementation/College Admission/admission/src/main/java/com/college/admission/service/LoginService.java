package com.college.admission.service;
import com.college.admission.model.Login;
import com.college.admission.repository.LoginRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LoginService {

    @Autowired
    private LoginRepository loginRepository;

    public List<Login> getAllLogins() {
        return loginRepository.findAll();
    }

    public Optional<Login> getLoginById(Integer id) {
        return loginRepository.findById(id);
    }

    public Optional<Login> getLoginByUsername(String username) {
        return loginRepository.findByUsername(username);
    }

    public Login createLogin(Login login) {
        return loginRepository.save(login);
    }

    public Login updateLogin(Integer id, Login loginDetails) {
        Login login = loginRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Login not found with id: " + id));
        login.setUsername(loginDetails.getUsername());
        login.setPasswordHash(loginDetails.getPasswordHash());
        login.setStudent(loginDetails.getStudent());
        return loginRepository.save(login);
    }

    public void deleteLogin(Integer id) {
        if (!loginRepository.existsById(id)) {
            throw new RuntimeException("Login not found with id: " + id);
        }
        loginRepository.deleteById(id);
    }
}