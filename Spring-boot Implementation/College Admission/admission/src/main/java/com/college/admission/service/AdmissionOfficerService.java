package com.college.admission.service;
import com.college.admission.model.AdmissionOfficer;
import com.college.admission.repository.AdmissionOfficerRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AdmissionOfficerService {

    private final AdmissionOfficerRepository repo;

    public AdmissionOfficerService(AdmissionOfficerRepository repo){
        this.repo = repo;
    }

    public List<AdmissionOfficer> getAll(){ return repo.findAll(); }

    public AdmissionOfficer getById(Integer id){ return repo.findById(id).orElseThrow(); }

    public AdmissionOfficer save(AdmissionOfficer obj){ return repo.save(obj); }

    public void delete(Integer id){ repo.deleteById(id); }
}
