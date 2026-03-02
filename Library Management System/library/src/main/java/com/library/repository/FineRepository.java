// repository/FineRepository.java
package com.library.repository;

import com.library.model.Fine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;

@Repository
public interface FineRepository extends JpaRepository<Fine, String> {
    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(f.amount), 0) FROM Fine f WHERE f.status = 'Unpaid'")
    BigDecimal totalUnpaidFines();
}