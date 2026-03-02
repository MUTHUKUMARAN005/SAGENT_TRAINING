package com.college.admission.service;
import com.college.admission.model.Application;
import com.college.admission.repository.ApplicationRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Optional;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }

    public Optional<Application> getApplicationById(Integer id) {
        return applicationRepository.findById(id);
    }

    public List<Application> getApplicationsByStudentId(Integer studentId) {
        return applicationRepository.findByStudentStudentID(studentId);
    }

    public List<Application> getApplicationsByStatus(String status) {
        return applicationRepository.findByStatus(status);
    }

    public Application createApplication(Application application) {
        return applicationRepository.save(application);
    }

    public Application updateApplication(Integer id, Application applicationDetails) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found with id: " + id));
        application.setStudent(applicationDetails.getStudent());
        application.setCourse(applicationDetails.getCourse());
        application.setSubmissionDate(applicationDetails.getSubmissionDate());
        application.setStatus(applicationDetails.getStatus());
        return applicationRepository.save(application);
    }

    public void deleteApplication(Integer id) {
        applicationRepository.deleteById(id);
    }
}
