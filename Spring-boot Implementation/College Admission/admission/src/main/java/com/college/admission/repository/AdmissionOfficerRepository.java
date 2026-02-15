package com.college.admission.repository;
import com.college.admission.model.AdmissionOfficer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdmissionOfficerRepository extends JpaRepository<AdmissionOfficer, Integer> {
}