// src/main/java/com/daansetu/repository/NGORepository.java
package com.daansetu.repository;

import com.daansetu.entity.NGO;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NGORepository extends JpaRepository<NGO, Long> {
    Optional<NGO> findByEmail(String email);
    Optional<NGO> findByEmailIgnoreCase(String email);
    List<NGO> findByNgoNameIgnoreCase(String ngoName);
    List<NGO> findByVerifiedTrue();
    List<NGO> findByCity(String city);
    long countByVerifiedTrue();
}