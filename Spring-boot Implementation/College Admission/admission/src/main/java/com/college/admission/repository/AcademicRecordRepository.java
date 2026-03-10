package com.college.admission.repository;
import com.college.admission.model.AcademicRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AcademicRecordRepository extends JpaRepository<AcademicRecord, Integer> {
    List<AcademicRecord> findByStudentStudentID(Integer studentID);
}