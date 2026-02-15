package com.college.admission.controller;

import com.college.admission.model.AcademicRecord;
import com.college.admission.repository.AcademicRecordRepository;
import com.college.admission.service.AcademicDetailsService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/academic-records")
public class AcademicRecordController {

    @Autowired
    private AcademicRecordRepository academicRecordRepository;

    @GetMapping
    public List<AcademicRecord> getAll() {
        return academicRecordRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AcademicRecord> getById(@PathVariable Integer id) {
        return academicRecordRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public List<AcademicRecord> getByStudentId(@PathVariable Integer studentId) {
        return academicRecordRepository.findByStudentStudentID(studentId);
    }

    @PostMapping
    public AcademicRecord create(@RequestBody AcademicRecord record) {
        return academicRecordRepository.save(record);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        academicRecordRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
