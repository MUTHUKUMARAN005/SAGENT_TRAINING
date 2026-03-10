// repository/BookCopyRepository.java
package com.library.repository;

import com.library.model.BookCopy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookCopyRepository extends JpaRepository<BookCopy, String> {
    List<BookCopy> findByStatus(String status);
    long countByStatus(String status);
}