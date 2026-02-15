package com.college.admission.repository;
import com.college.admission.model.ApplicationStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationStatusLogRepository extends JpaRepository<ApplicationStatusLog,Integer>{
    List<ApplicationStatusLog> findByApplicationApplicationID(Integer applicationId);
}
