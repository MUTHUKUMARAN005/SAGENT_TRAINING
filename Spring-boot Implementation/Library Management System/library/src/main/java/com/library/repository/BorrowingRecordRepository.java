// repository/BorrowingRecordRepository.java
package com.library.repository;

import com.library.model.BorrowingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BorrowingRecordRepository extends JpaRepository<BorrowingRecord, String> {
    List<BorrowingRecord> findByStatus(String status);
    long countByStatus(String status);
}