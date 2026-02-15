// File: src/main/java/com/healthcare/repository/UserRepository.java
package com.healthcare.repository;

import com.healthcare.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}