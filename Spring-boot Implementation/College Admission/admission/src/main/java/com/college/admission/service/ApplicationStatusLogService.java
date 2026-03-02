package com.college.admission.service;
import com.college.admission.model.ApplicationStatusLog;
import com.college.admission.repository.ApplicationStatusLogRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ApplicationStatusLogService {

    @Autowired
    private ApplicationStatusLogRepository applicationStatusLogRepository;

    public List<ApplicationStatusLog> getAllLogs() {
        return applicationStatusLogRepository.findAll();
    }

    public Optional<ApplicationStatusLog> getLogById(Integer id) {
        return applicationStatusLogRepository.findById(id);
    }

    public List<ApplicationStatusLog> getLogsByApplicationId(Integer applicationId) {
        return applicationStatusLogRepository.findByApplicationApplicationID(applicationId);
    }

    public ApplicationStatusLog createLog(ApplicationStatusLog log) {
        return applicationStatusLogRepository.save(log);
    }

    public ApplicationStatusLog updateLog(Integer id, ApplicationStatusLog logDetails) {
        ApplicationStatusLog log = applicationStatusLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application Status Log not found with id: " + id));
        log.setApplication(logDetails.getApplication());
        log.setStatus(logDetails.getStatus());
        log.setChangedBy(logDetails.getChangedBy());
        log.setChangeDate(logDetails.getChangeDate());
        return applicationStatusLogRepository.save(log);
    }

    public void deleteLog(Integer id) {
        if (!applicationStatusLogRepository.existsById(id)) {
            throw new RuntimeException("Application Status Log not found with id: " + id);
        }
        applicationStatusLogRepository.deleteById(id);
    }
}
