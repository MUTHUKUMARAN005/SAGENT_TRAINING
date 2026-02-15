package com.college.admission.repository;
import com.college.admission.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Integer> {
    List<Document> findByStudentStudentID(Integer studentID);
}