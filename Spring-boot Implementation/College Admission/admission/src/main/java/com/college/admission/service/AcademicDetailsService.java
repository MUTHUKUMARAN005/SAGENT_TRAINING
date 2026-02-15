package com.college.admission.service;
import com.college.admission.model.AcademicRecord;
import com.college.admission.repository.AcademicRecordRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AcademicDetailsService {

    private final AcademicRecordRepository repo;

    public AcademicDetailsService(AcademicRecordRepository repo){
        this.repo = repo;
    }

    public List<AcademicRecord> getAll(){ return repo.findAll(); }

    public AcademicRecord getById(Integer id){ return repo.findById(id).orElseThrow(); }

    public AcademicRecord save(AcademicRecord obj){ return repo.save(obj); }

    public void delete(Integer id){ repo.deleteById(id); }
}
