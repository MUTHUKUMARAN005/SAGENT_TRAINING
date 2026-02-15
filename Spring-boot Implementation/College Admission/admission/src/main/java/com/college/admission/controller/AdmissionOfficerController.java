package com.college.admission.controller;

import com.college.admission.model.AdmissionOfficer;
import com.college.admission.repository.AdmissionOfficerRepository;
import com.college.admission.service.AdmissionOfficerService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/officers")
public class AdmissionOfficerController {

    @Autowired
    private AdmissionOfficerRepository officerRepository;

    @GetMapping
    public List<AdmissionOfficer> getAll() {
        return officerRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdmissionOfficer> getById(@PathVariable Integer id) {
        return officerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public AdmissionOfficer create(@RequestBody AdmissionOfficer officer) {
        return officerRepository.save(officer);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdmissionOfficer> update(@PathVariable Integer id, @RequestBody AdmissionOfficer details) {
        return officerRepository.findById(id).map(officer -> {
            officer.setName(details.getName());
            officer.setEmail(details.getEmail());
            officer.setDepartment(details.getDepartment());
            return ResponseEntity.ok(officerRepository.save(officer));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        officerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}