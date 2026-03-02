package com.college.admission.repository;
// src/main/java/com/admission/repository/LoginRepository.java

import com.college.admission.model.Login;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface LoginRepository extends JpaRepository<Login, Integer> {
    Optional<Login> findByUsername(String username);
}