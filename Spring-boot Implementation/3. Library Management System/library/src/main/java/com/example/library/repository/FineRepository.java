package com.example.library.repository;

import com.example.library.model.Fine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FineRepository extends JpaRepository<Fine, String> {
}
