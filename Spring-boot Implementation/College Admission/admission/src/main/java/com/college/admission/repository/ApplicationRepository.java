package com.college.admission.repository;
import com.college.admission.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Integer> {
    List<Application> findByStudentStudentID(Integer studentID);
    List<Application> findByStatus(String status);
}