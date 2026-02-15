// repository/RequestRepository.java
package com.library.repository;

import com.library.model.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RequestRepository extends JpaRepository<Request, String> {
    long countByStatus(String status);
}